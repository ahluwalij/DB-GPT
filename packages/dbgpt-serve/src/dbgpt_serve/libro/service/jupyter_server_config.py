c = get_config()  # noqa
# For dbgpt page iframe to correctly load and display libro page
c.ServerApp.disable_check_xsrf = True

# Default startup libro does not automatically open new page
c.ServerApp.open_browser = False

# Default fixed port when starting libro
c.ServerApp.port = 9999

# Disable automatic search for idle ports
c.ServerApp.port_retries = 0
c.ContentsManager.allow_hidden = True
c.ServerApp.token = ""
c.ServerApp.password = ""
