# config valid only for Capistrano 3.1
lock '3.1.0'

set :application, 'redash'
set :repo_url, 'https://github.com/hailocab/redash.git'

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/opt/redash/redash/'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :deploy do

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
         puts "Restarting server..."
         execute "sudo service redash_web restart"
         puts "Done."
         puts "Restarting workers..."
         execute "sudo service redash_updater restart"
         puts "Done."
    end
  end

  after :publishing, :restart

  after :restart, :npm do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
         puts "Doing npm dependencies..."
         execute "cd /opt/redash/redash/current/rd_ui && npm install && bower install --config.interactive=false"
         puts "Done."
    end
  end

end
