# Extended Server Syntax
# ======================
# This can be used to drop a more detailed server
# definition into the server list. The second argument
# something that quacks like a hash can be used to set
# extended properties on the server.
server '10.1.2.224', user: 'deploy', roles: %w{web app}, my_property: :my_value


# it's possible to pass any option but you need to keep in mind that net/ssh understand limited list of options
# it's possible to pass any option but you need to keep in mind that net/ssh und        limited list of options
# you can see them in [net/ssh documentation](http://net-ssh.github.io/net-ssh/classes/Net/SSH.html#method-c-start)
# set it globally
#  set :ssh_options, {
#    keys: %w(/home/rlisowski/.ssh/id_rsa),
#    forward_agent: false,
#    auth_methods: %w(password)
#  }
# and/or per server
 server '10.1.2.224',
   user: 'deploy',
   roles: %w{web app},
   ssh_options: {
     user: 'deploy', # overrides user setting above
     forward_agent: true,
     auth_methods: %w(publickey password)
     # password: 'please use keys'
   }
# setting per server overrides global ssh_options
