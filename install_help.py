#!/usr/bin/env python
# /// script
# dependencies = [
#   "tomli",
#   "click",
#   "inquirer",
# ]
# [tool.uv]
# exclude-newer = "2025-03-07T00:00:00Z"
# ///
import glob
import os
from pathlib import Path
from typing import Any, Dict

import click
import inquirer
import tomli


def extract_workspace_extras():
    """Determine the workspace root and extract extras dependencies for all packages"""
    # First locate the workspace root (directory containing pyproject.toml with
    # tool.uv.workspace)
    current_dir = os.getcwd()
    workspace_root = None

    # Find the workspace root
    while current_dir != os.path.dirname(current_dir):  # Stop at root
        pyproject_path = os.path.join(current_dir, "pyproject.toml")
        if os.path.exists(pyproject_path):
            try:
                with open(pyproject_path, "rb") as f:
                    pyproject_data = tomli.load(f)
                    if pyproject_data.get("tool", {}).get("uv", {}).get("workspace"):
                        workspace_root = current_dir
                        break
            except Exception as e:
                print(f"Cannot parse {pyproject_path}: {e}")
        current_dir = os.path.dirname(current_dir)

    if not workspace_root:
        print("Workspace root not found.")
        return {}

    # Read the workspace configuration
    with open(os.path.join(workspace_root, "pyproject.toml"), "rb") as f:
        root_data = tomli.load(f)

    workspace_config = root_data.get("tool", {}).get("uv", {}).get("workspace", {})
    members_patterns = workspace_config.get("members", [])
    exclude_patterns = workspace_config.get("exclude", [])

    # Extract all member packages
    member_dirs = []
    for pattern in members_patterns:
        # Convert glob pattern to absolute path
        full_pattern = os.path.join(workspace_root, pattern)
        matches = glob.glob(full_pattern, recursive=True)

        for match in matches:
            if os.path.isdir(match) and os.path.exists(
                os.path.join(match, "pyproject.toml")
            ):
                # Check if the directory should be excluded
                should_exclude = False
                for exclude_pattern in exclude_patterns:
                    if Path(match).match(os.path.join(workspace_root, exclude_pattern)):
                        should_exclude = True
                        break

                if not should_exclude:
                    member_dirs.append(match)

    # Add the workspace root as a member package
    member_dirs.append(workspace_root)

    # Extract extras for each member package
    all_extras = {}

    for member_dir in member_dirs:
        member_path = os.path.join(member_dir, "pyproject.toml")
        try:
            with open(member_path, "rb") as f:
                member_data = tomli.load(f)

            project_name = member_data.get("project", {}).get(
                "name", os.path.basename(member_dir)
            )
            optional_deps = member_data.get("project", {}).get(
                "optional-dependencies", {}
            )

            if optional_deps:
                all_extras[project_name] = {
                    "path": member_dir,
                    "extras": list(optional_deps.keys()),
                    "details": optional_deps,
                }

        except Exception as e:
            print(f"Cannot parse {member_path}: {e}")

    return all_extras


# Preset deployment templates
def get_deployment_presets():
    """Get deployment presets"""
    return {
        "OpenAI Proxy Mode": {
            "extras": ["base", "proxy_openai", "rag", "storage_chromadb", "dbgpts"],
            "config": "configs/dbgpt-proxy-openai.toml",
            "description": "Using OpenAI API as proxy, suitable for environments without GPU",
            "note": "Requires OpenAI API Key",
        },
        "DeepSeek Proxy Mode": {
            "extras": ["base", "proxy_openai", "rag", "storage_chromadb", "dbgpts"],
            "config": "configs/dbgpt-proxy-deepseek.toml",
            "description": "Using DeepSeek API as proxy, suitable for environments without GPU",
            "note": "Requires DeepSeek API Key",
        },
        "GLM4 Local Mode": {
            "extras": [
                "base",
                "hf",
                "cuda121",
                "rag",
                "storage_chromadb",
                "quant_bnb",
                "dbgpts",
            ],
            "config": "configs/dbgpt-local-glm.toml",
            "description": "Using local GLM4 model, requires GPU environment",
            "note": "Requires local model path configuration",
        },
        "VLLM Local Mode": {
            "extras": [
                "base",
                "hf",
                "cuda121",
                "vllm",
                "rag",
                "storage_chromadb",
                "quant_bnb",
                "dbgpts",
            ],
            "config": "configs/dbgpt-local-vllm.toml",
            "description": "Using VLLM framework to load local model, requires GPU environment",
            "note": "Requires local model path configuration",
        },
        "LLAMA_CPP Local Mode": {
            "extras": [
                "base",
                "hf",
                "cuda121",
                "llama_cpp",
                "rag",
                "storage_chromadb",
                "quant_bnb",
                "dbgpts",
            ],
            "config": "configs/dbgpt-local-llama-cpp.toml",
            "description": "Using LLAMA.cpp framework to load local model, can run on CPU but GPU recommended",
            "note": 'Requires local model path configuration, for CUDA support set CMAKE_ARGS="-DGGML_CUDA=ON"',
        },
        "Ollama Proxy Mode": {
            "extras": ["base", "proxy_ollama", "rag", "storage_chromadb", "dbgpts"],
            "config": "configs/dbgpt-proxy-ollama.toml",
            "description": "Using Ollama as proxy, suitable for environments without GPU",
            "note": "Requires Ollama API Base",
        },
        "Custom Mode": {
            "extras": [],
            "config": "",
            "description": "Manually select needed extras",
            "note": "Suitable for advanced users",
        },
    }


@click.group()
def cli():
    """UV Workspace Extras Helper - Manage optional dependencies in UV workspace"""
    pass


@cli.command("list")
@click.option("--verbose", "-v", is_flag=True, help="Show detailed dependency information")
def list_extras(verbose):
    """List all extras in the workspace"""
    extras = extract_workspace_extras()

    if not extras:
        click.echo("No workspace or extras found.")
        return

    click.echo("Extras in workspace:\n")

    for package, info in extras.items():
        click.echo(
            click.style(f"📦 {package}", fg="green")
            + click.style(f" ({os.path.relpath(info['path'])})", fg="blue")
        )

        if info["extras"]:
            click.echo("  Available extras:")
            for extra in info["extras"]:
                deps = info["details"][extra]
                click.echo(
                    f"    - {click.style(extra, fg='yellow')}: {len(deps)} dependencies"
                )

                if verbose:
                    for dep in deps:
                        click.echo(f"      • {dep}")
        else:
            click.echo("  No extras defined")
        click.echo()


@cli.command("install-cmd")
@click.option("--interactive", "-i", is_flag=True, help="Interactive guide to generate installation commands")
@click.option("--all", "install_all", is_flag=True, help="Generate command to install all extras")
@click.option("--china", is_flag=True, help="Use Tsinghua PyPI mirror for faster installation in China")
@click.argument("package", required=False)
@click.argument("extra", required=False)
def install_command(interactive, install_all, china, package, extra):
    """Generate installation commands for extras"""
    extras = extract_workspace_extras()

    if not extras:
        click.echo("No workspace or extras found.")
        return

    # Interactive mode
    if interactive:
        _interactive_install_guide(extras, china)
        return

    # Install all extras
    if install_all:
        all_extras = []
        for pkg_info in extras.values():
            all_extras.extend(pkg_info["extras"])

        if all_extras:
            cmd = "uv sync --all-packages " + " ".join(
                [f'--extra "{e}"' for e in all_extras]
            )
            if china:
                cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"
            click.echo("# Install all optional features:")
            click.echo(cmd)
        else:
            click.echo("No workspace or extras found.")
        return

    # If no package or extra is provided, show all possible installation commands
    if not package:
        for pkg, info in extras.items():
            if info["extras"]:
                for e in info["extras"]:
                    cmd = f'uv sync --extra "{e}"'
                    if china:
                        cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"
                    click.echo(f"# Install {e} feature for {pkg}:")
                    click.echo(cmd)
                click.echo()
        return

    # Check if the specified package exists
    if package not in extras:
        click.echo(f"Error: Package '{package}' not in workspace or has no extras defined.")
        click.echo(f"Available packages: {', '.join(extras.keys())}")
        return

    # If no extra is provided, show all extras for the package
    if not extra:
        pkg_extras = extras[package]["extras"]
        if not pkg_extras:
            click.echo(f"Package '{package}' has no extras defined.")
            return

        cmd = "uv sync " + " ".join([f'--extra "{e}"' for e in pkg_extras])
        if china:
            cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"
        click.echo(f"# Install {' '.join(pkg_extras)} feature for {package}:")
        click.echo(cmd)
        return

    # Check if the specified extra exists
    if extra not in extras[package]["extras"]:
        click.echo(f"Error: Extra '{extra}' not found in package '{package}'.")
        click.echo(f"Available extras: {', '.join(extras[package]['extras'])}")
        return

    # Generate installation command for the specific extra
    cmd = f'uv sync --extra "{extra}"'
    if china:
        cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"

    click.echo(f"# Install {extra} feature for {package}:")
    click.echo(cmd)
    click.echo()
    click.echo("Please copy the above command to execute in terminal. For more help, run:")
    click.echo("python install_help.py --help")


def _interactive_install_guide(extras: Dict[str, Any], use_china_mirror: bool = False):
    """Interactive installation guide"""
    click.echo("Welcome to DB-GPT Installation Assistant!")
    click.echo("This tool will help you generate the correct installation commands.\n")

    # Get available presets
    presets = get_deployment_presets()
    preset_choices = list(presets.keys())

    # Ask user to select mode
    mode_question = inquirer.List(
        "mode",
        message="Please select installation mode",
        choices=preset_choices,
    )

    try:
        answers = inquirer.prompt([mode_question])
        if not answers:
            click.echo("Operation canceled.")
            return

        selected_mode = answers["mode"]
        preset_config = presets[selected_mode]

        # Show installation information
        click.echo("\n📋 Installation Information")
        click.echo(f"📦 Selected mode: {selected_mode}")
        click.echo(f"📝 Description: {preset_config['description']}")
        click.echo(f"ℹ️  Note: {preset_config['note']}")

        if selected_mode == "Custom Mode":
            # For custom mode, let user select extras
            all_extras = []
            for pkg_info in extras.values():
                all_extras.extend(pkg_info["extras"])

            if not all_extras:
                click.echo("No extras found.")
                return

            extras_question = inquirer.Checkbox(
                "extras",
                message="Please select extras to install (space to select/deselect, enter to confirm)",
                choices=all_extras,
            )

            extra_answers = inquirer.prompt([extras_question])
            if not extra_answers:
                click.echo("Operation canceled.")
                return

            selected_extras = extra_answers["extras"]
        else:
            selected_extras = preset_config["extras"]

        click.echo(f"🧩 Will install the following extras: {', '.join(selected_extras)}")

        if preset_config["config"]:
            click.echo(f"⚙️  Configuration file: {preset_config['config']}")

        # Ask if user wants to generate command
        confirm = inquirer.Confirm(
            "confirm", message="Generate installation command?", default=True
        )
        confirm_answer = inquirer.prompt([confirm])

        if not confirm_answer or not confirm_answer["confirm"]:
            click.echo("Operation canceled.")
            return

        # Generate installation command
        if selected_extras:
            cmd = "uv sync --all-packages " + " ".join(
                [f'--extra "{e}"' for e in selected_extras]
            )
            if use_china_mirror:
                cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"

            click.echo("\n🚀 Installation Command")
            click.echo(cmd)

            click.echo("\n🏃 Startup Command")
            click.echo("dbgpt start webserver")

            if preset_config["config"]:
                click.echo("\n⚠️  Further Configuration")
                if "api" in preset_config["config"].lower():
                    click.echo(f"Please make sure you set the correct API Key in the configuration file {preset_config['config']}")
                else:
                    click.echo(f"Please make sure you set the correct model path in the configuration file {preset_config['config']}")

        click.echo("\nFinished!")

    except KeyboardInterrupt:
        click.echo("\nOperation canceled.")


@cli.command("deploy")
@click.option("--preset", "-p", help="Use predefined deployment template")
@click.option("--china", is_flag=True, help="Use Tsinghua PyPI mirror for faster installation in China")
@click.option(
    "--list", "list_presets", is_flag=True, help="List all predefined deployment templates"
)
def deploy_preset(preset, china, list_presets):
    """Use predefined deployment templates"""
    presets = get_deployment_presets()

    if list_presets:
        click.echo("Available deployment presets:")
        for name, config in presets.items():
            click.echo(f"\n📦 {click.style(name, fg='green')}")
            click.echo(f"   📝 {config['description']}")
            click.echo(f"   ℹ️  {config['note']}")
            if config["extras"]:
                click.echo(f"   🧩 Extras: {', '.join(config['extras'])}")
            if config["config"]:
                click.echo(f"   ⚙️  Config: {config['config']}")
        return

    if not preset:
        click.echo("Please specify a deployment preset name, or use --list to view all presets")
        return

    if preset not in presets:
        click.echo(f"Error: Preset '{preset}' not found")
        click.echo(f"Available presets: {', '.join(presets.keys())}")
        return

    preset_config = presets[preset]
    click.echo(f"Using preset '{preset}' to generate deployment command")

    if preset == "Custom Mode":
        # For custom mode, use interactive guide
        extras = extract_workspace_extras()
        _interactive_install_guide(extras, china)
    else:
        # Generate installation command
        if preset_config["extras"]:
            cmd = "uv sync --all-packages " + " ".join(
                [f'--extra "{e}"' for e in preset_config["extras"]]
            )
            if china:
                cmd += " --index-url=https://pypi.tuna.tsinghua.edu.cn/simple"

            click.echo(f"\n🚀 Installation Command")
            click.echo(cmd)

            click.echo(f"\n🏃 Startup Command")
            click.echo("dbgpt start webserver")

            if preset_config["config"]:
                click.echo(f"\n⚠️  Further Configuration")
                if "api" in preset_config["config"].lower():
                    click.echo(f"Please make sure you set the correct API Key in the configuration file {preset_config['config']}")
                else:
                    click.echo(f"Please make sure you set the correct model path in the configuration file {preset_config['config']}")

        click.echo("\nFinished!")


if __name__ == "__main__":
    cli()
