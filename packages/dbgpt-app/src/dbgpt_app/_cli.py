import functools
import os
from typing import Any, Dict, Optional

import click

from dbgpt.configs.model_config import LOGDIR
from dbgpt.model.cli import add_start_server_options
from dbgpt.util.command_utils import _run_current_with_daemon, _stop_service

_GLOBAL_CONFIG: str = ""


@click.command(name="webserver")
@add_start_server_options
def start_webserver(config: str, **kwargs):
    """Start webserver(dbgpt_server.py)"""
    if kwargs["daemon"]:
        log_file = os.path.join(LOGDIR, "webserver_uvicorn.log")
        _run_current_with_daemon("WebServer", log_file)
    else:
        from dbgpt_app.dbgpt_server import run_webserver

        run_webserver(config)


@click.command(name="webserver")
@click.option(
    "--port",
    type=int,
    default=None,
    required=False,
    help=("The port to stop"),
)
def stop_webserver(port: int):
    """Stop webserver(dbgpt_server.py)"""
    _stop_service("webserver", "WebServer", port=port)


def _stop_all_dbgpt_server():
    _stop_service("webserver", "WebServer")


@click.group("migration")
@click.option(
    "-c",
    "--config",
    required=True,
    type=str,
    help=_("The database configuration file"),
)
def migration(config: str):
    """Manage database migration"""
    global _GLOBAL_CONFIG
    _GLOBAL_CONFIG = config


def add_migration_options(func):
    @click.option(
        "--alembic_ini_path",
        required=False,
        type=str,
        default=None,
        show_default=True,
        help="Alembic ini path, if not set, use 'pilot/meta_data/alembic.ini'",
    )
    @click.option(
        "--script_location",
        required=False,
        type=str,
        default=None,
        show_default=True,
        help="Alembic script location, if not set, use 'pilot/meta_data/alembic'",
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


@migration.command()
@add_migration_options
@click.option(
    "-m",
    "--message",
    required=False,
    type=str,
    default="Init migration",
    show_default=True,
    help="The message for create migration repository",
)
def init(alembic_ini_path: str, script_location: str, message: str):
    """Initialize database migration repository"""
    from dbgpt.util._db_migration_utils import create_migration_script

    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)
    create_migration_script(alembic_cfg, db_manager.engine, message)


@migration.command()
@add_migration_options
@click.option(
    "-m",
    "--message",
    required=False,
    type=str,
    default="New migration",
    show_default=True,
    help="The message for migration script",
)
def migrate(alembic_ini_path: str, script_location: str, message: str):
    """Create migration script"""
    from dbgpt.util._db_migration_utils import create_migration_script

    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)
    create_migration_script(alembic_cfg, db_manager.engine, message)


@migration.command()
@add_migration_options
@click.option(
    "--sql-output",
    type=str,
    default=None,
    help="Generate SQL script for migration instead of applying it. ex: "
    "--sql-output=upgrade.sql",
)
def upgrade(alembic_ini_path: str, script_location: str, sql_output: str):
    """Upgrade database to target version"""
    from dbgpt.util._db_migration_utils import (
        generate_sql_for_upgrade,
        upgrade_database,
    )

    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)
    if sql_output:
        generate_sql_for_upgrade(alembic_cfg, db_manager.engine, output_file=sql_output)
    else:
        upgrade_database(alembic_cfg, db_manager.engine)


@migration.command()
@add_migration_options
@click.option(
    "-y",
    required=False,
    type=bool,
    default=False,
    is_flag=True,
    help="Confirm to downgrade database",
)
@click.option(
    "-r",
    "--revision",
    default="-1",
    show_default=True,
    help="Revision to downgrade to",
)
def downgrade(alembic_ini_path: str, script_location: str, y: bool, revision: str):
    """Downgrade database to target version"""
    from dbgpt.util._db_migration_utils import downgrade_database

    if not y:
        click.confirm("Are you sure you want to downgrade the database?", abort=True)
    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)
    downgrade_database(alembic_cfg, db_manager.engine, revision)


@migration.command()
@add_migration_options
@click.option(
    "--drop_all_tables",
    required=False,
    type=bool,
    default=False,
    is_flag=True,
    help="Drop all tables",
)
@click.option(
    "-y",
    required=False,
    type=bool,
    default=False,
    is_flag=True,
    help="Confirm to clean migration data",
)
@click.option(
    "--confirm_drop_all_tables",
    required=False,
    type=bool,
    default=False,
    is_flag=True,
    help="Confirm to drop all tables",
)
def clean(
    alembic_ini_path: str,
    script_location: str,
    drop_all_tables: bool,
    y: bool,
    confirm_drop_all_tables: bool,
):
    """Clean Alembic migration scripts and history"""
    from dbgpt.util._db_migration_utils import clean_alembic_migration

    if not y:
        click.confirm(
            "Are you sure clean alembic migration scripts and history?", abort=True
        )
    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)
    clean_alembic_migration(alembic_cfg, db_manager.engine)
    if drop_all_tables:
        if not confirm_drop_all_tables:
            click.confirm("\nAre you sure drop all tables?", abort=True)
        with db_manager.engine.connect() as connection:
            for tbl in reversed(db_manager.Model.metadata.sorted_tables):
                print(f"Drop table {tbl.name}")
                connection.execute(tbl.delete())


@migration.command()
@add_migration_options
def list(alembic_ini_path: str, script_location: str):
    """List all versions in the migration history, marking the current one"""
    from alembic.runtime.migration import MigrationContext
    from alembic.script import ScriptDirectory

    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)

    # Set up Alembic environment and script directory
    script = ScriptDirectory.from_config(alembic_cfg)

    # Get current revision
    def get_current_revision():
        with db_manager.engine.connect() as connection:
            context = MigrationContext.configure(connection)
            return context.get_current_revision()

    current_rev = get_current_revision()

    # List all revisions and mark the current one
    for revision in script.walk_revisions():
        current_marker = "(current)" if revision.revision == current_rev else ""
        print(f"{revision.revision} {current_marker}: {revision.doc}")


@migration.command()
@add_migration_options
@click.argument("revision", required=True)
def show(alembic_ini_path: str, script_location: str, revision: str):
    """Show the migration script for a specific version."""
    from alembic.script import ScriptDirectory

    alembic_cfg, db_manager = _get_migration_config(alembic_ini_path, script_location)

    script = ScriptDirectory.from_config(alembic_cfg)

    rev = script.get_revision(revision)
    if rev is None:
        print(f"Revision {revision} not found.")
        return

    # Find the migration script file
    script_files = os.listdir(os.path.join(script.dir, "versions"))
    script_file = next((f for f in script_files if f.startswith(revision)), None)

    if script_file is None:
        print(f"Migration script for revision {revision} not found.")
        return
    # Print the migration script
    script_file_path = os.path.join(script.dir, "versions", script_file)
    print(f"Migration script for revision {revision}: {script_file_path}")
    try:
        with open(script_file_path, "r") as file:
            print(file.read())
    except FileNotFoundError:
        print(f"Migration script {script_file_path} not found.")


def _get_migration_config(
    alembic_ini_path: Optional[str] = None, script_location: Optional[str] = None
):
    from dbgpt.configs.model_config import resolve_root_path
    from dbgpt.datasource.base import BaseDatasourceParameters
    from dbgpt.storage.metadata.db_manager import db as db_manager
    from dbgpt.util._db_migration_utils import create_alembic_config
    from dbgpt.util.configure.manager import ConfigurationManager
    from dbgpt_app.base import _initialize_db
    from dbgpt_app.initialization.db_model_initialization import _MODELS  # noqa: F401
    from dbgpt_ext.datasource.rdbms.conn_sqlite import SQLiteConnectorParameters

    cfg = ConfigurationManager.from_file(_GLOBAL_CONFIG)
    db_config = cfg.parse_config(
        BaseDatasourceParameters, prefix="service.web.database", hook_section="hooks"
    )
    db_name = ""
    if isinstance(db_config, SQLiteConnectorParameters):
        db_config.path = resolve_root_path(db_config.path)
        db_dir = os.path.dirname(db_config.path)
        os.makedirs(db_dir, exist_ok=True)
        # Parse the db name from the db path
        db_name = os.path.basename(db_config.path).split(".")[0]
    else:
        raise ValueError("Only SQLite is supported for migration now.")
    db_url = db_config.db_url()
    db_engine_args: Optional[Dict[str, Any]] = db_config.engine_args()

    # Import all models to make sure they are registered with SQLAlchemy.

    # initialize db
    default_meta_data_path = _initialize_db(
        db_url, "sqlite", db_name, db_engine_args, try_to_create_db=True
    )
    alembic_cfg = create_alembic_config(
        default_meta_data_path,
        db_manager.engine,
        db_manager.Model,
        db_manager.session(),
        alembic_ini_path,
        script_location,
    )
    return alembic_cfg, db_manager
