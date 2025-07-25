from dataclasses import dataclass

from dbgpt.core.awel.flow import (
    TAGS_ORDER_HIGH,
    ResourceCategory,
    auto_register_resource,
)
from dbgpt_serve.core import BaseServeConfig

APP_NAME = "dbgpts_my"
SERVE_APP_NAME = "dbgpt_serve_dbgpts_my"
SERVE_APP_NAME_HUMP = "dbgpt_serve_DbgptsMy"
SERVE_CONFIG_KEY_PREFIX = "dbgpt.serve.dbgpts_my."
SERVE_SERVICE_COMPONENT_NAME = f"{SERVE_APP_NAME}_service"
# Database table name
SERVER_APP_TABLE_NAME = SERVE_APP_NAME


@auto_register_resource(
    label=_("My dbgpts Serve Configurations"),
    category=ResourceCategory.COMMON,
    tags={"order": TAGS_ORDER_HIGH},
    description=_("This configuration is for the my dbgpts serve module."),
    show_in_ui=False,
)
@dataclass
class ServeConfig(BaseServeConfig):
    """Parameters for the serve command"""

    __type__ = APP_NAME
