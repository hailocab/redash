import functools
import hashlib
import hmac
import time
import json
import logging

from flask import session, request, make_response, redirect, url_for
from flask.ext.googleauth import GoogleAuth, login
from flask.ext.login import LoginManager, login_user, current_user
from werkzeug.contrib.fixers import ProxyFix
from flask_googlelogin import GoogleLogin

from models import AnonymousUser
from redash import app, models, settings


login_manager = LoginManager()
logger = logging.getLogger('authentication')

app.config.update(
    SECRET_KEY='Miengous3Xie5meiyae6iu6mohsaiRae',
    GOOGLE_LOGIN_CLIENT_ID='210515825314-4f5r35e7eesrajndhq7h96bj9mk5mrll.apps.googleusercontent.com',
    GOOGLE_LOGIN_CLIENT_SECRET='Mp9PG5eW8fzrSkm7g15lc8oe',
    GOOGLE_LOGIN_REDIRECT_URI='http://localhost:5000/oauth2callback')
googlelogin = GoogleLogin(app,login_manager)

def sign(key, path, expires):
    if not key:
        return None

    h = hmac.new(str(key), msg=path, digestmod=hashlib.sha1)
    h.update(str(expires))

    return h.hexdigest()


class HMACAuthentication(object):
    @staticmethod
    def api_key_authentication():
        signature = request.args.get('signature')
        expires = float(request.args.get('expires') or 0)
        query_id = request.view_args.get('query_id', None)

        # TODO: 3600 should be a setting
        if signature and query_id and time.time() < expires <= time.time() + 3600:
            query = models.Query.get(models.Query.id == query_id)
            calculated_signature = sign(query.api_key, request.path, expires)

            if query.api_key and signature == calculated_signature:
                login_user(models.ApiUser(query.api_key), remember=False)
                return True

        return False

    def required(self, fn):
        @functools.wraps(fn)
        def decorated(*args, **kwargs):
            if current_user.is_authenticated():
                return fn(*args, **kwargs)

            if self.api_key_authentication():
                return fn(*args, **kwargs)

            return make_response(redirect(url_for("login", next=request.url)))

        return decorated


def validate_email(email):
    if not settings.GOOGLE_APPS_DOMAIN:
        return True

    return email in settings.ALLOWED_EXTERNAL_USERS or email.endswith("@%s" % settings.GOOGLE_APPS_DOMAIN)


def create_and_login_user(app, user):
    if not validate_email(user.email):
        return

    try:
        user_object = models.User.get(models.User.email == user.email)
        if user_object.name != user.name:
            logger.debug("Updating user name (%r -> %r)", user_object.name, user.name)
            user_object.name = user.name
            user_object.save()
    except models.User.DoesNotExist:
        logger.debug("Creating user object (%r)", user.name)
        user_object = models.User.create(name=user.name, email=user.email, groups = ['default','default-non-jss'])

    login_user(user_object, remember=True)

login.connect(create_and_login_user)


@login_manager.user_loader
def load_user(user_id):
    return models.User.select().where(models.User.id == user_id).first()

@app.route('/oauth2callback')
@googlelogin.oauth2callback
def google_login(token, userinfo, **params):
    
    user = models.User.select().where(models.User.email == userinfo['email']).first()

    if (user == None):
        logger.debug("Creating user object (%r)", userinfo)
        user = models.User.create(name=userinfo['name'], email=userinfo['email'], groups = ['default','default-non-jss'])

    login_user(user)
    session['token'] = json.dumps(token)
    session['extra'] = params.get('extra')
    return redirect(request.args.get('next') or '/')



@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated():
        return redirect(request.args.get('next') or '/')

    if not settings.PASSWORD_LOGIN_ENABLED:

        return redirect(googlelogin.login_url(
            approval_prompt='force',
            scopes=['https://www.googleapis.com/auth/userinfo.email'],
            access_type='offline',
        ))

    if request.method == 'POST':
        user = models.User.select().where(models.User.email == request.form['username']).first()
        if user and user.verify_password(request.form['password']):
            remember = ('remember' in request.form)
            login_user(user, remember=remember)
            return redirect(request.args.get('next') or '/')

    return render_template("login.html",
                           name=settings.NAME,
                           analytics=settings.ANALYTICS,
                           next=request.args.get('next'),
                           username=request.form.get('username', ''),
                           show_google_openid=settings.GOOGLE_OPENID_ENABLED)

def setup_authentication(app):
    if settings.GOOGLE_OPENID_ENABLED:
        openid_auth = GoogleAuth(app, url_prefix="/google_auth")
        # If we don't have a list of external users, we can use Google's federated login, which limits
        # the domain with which you can sign in.
        if not settings.ALLOWED_EXTERNAL_USERS and settings.GOOGLE_APPS_DOMAIN:
            openid_auth._OPENID_ENDPOINT = "https://www.google.com/a/%s/o8/ud?be=o8" % settings.GOOGLE_APPS_DOMAIN

    login_manager.init_app(app)
    login_manager.anonymous_user = AnonymousUser
    app.wsgi_app = ProxyFix(app.wsgi_app)
    app.secret_key = settings.COOKIE_SECRET

    return HMACAuthentication()
