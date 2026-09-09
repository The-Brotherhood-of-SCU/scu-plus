import os
import re
import json
from urllib.parse import quote


def get_version() -> str:
    """从package.json读取版本号"""
    with open('package.json', 'r', encoding='utf-8') as f:
        return json.load(f)['version']


def get_release_notes(version: str) -> str:
    """从CHANGELOG.md中提取对应版本的更新内容"""
    with open('CHANGELOG.md', 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配 "## [x.y.z] - date" 到下一个 "## [" 之间的内容
    pattern = rf"^## \[{re.escape(version)}\] - .*?$(.+?)(?=^## \[|\Z)"
    match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
    if not match:
        print(f"warning: CHANGELOG.md 中未找到版本 {version} 的更新记录")
        return ""

    notes = match.group(1).strip()
    # 去掉空的小节标题（如 "### Added" 下没有任何条目）
    notes = re.sub(r"### \w+\s*(?=### |\Z)", "", notes).strip()
    return notes


def set_env(key: str, value: str):
    """追加写入 GitHub Actions 环境变量"""
    if "GITHUB_ENV" not in os.environ:
        print("GITHUB_ENV not found. Env not exported.")
        return
    with open(os.environ["GITHUB_ENV"], "a", encoding='utf-8') as f:
        f.write(f"{key}<<EOF\n{value}\nEOF\n")


if __name__ == "__main__":
    import sys
    import io

    # Set stdout to use UTF-8 encoding
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    version = get_version()
    print(f"version: {version}")

    release_notes = (
        "请下载 chrome-mv3-prod.zip 文件\n\n"
        "目前FireFox扩展正在测试中，稳定性未知，建议在测试环境中使用。\n\n"
        f"macOS Safari：[dmg](https://github.com/Visio-Vanitas/scu-plus/releases/download/{quote('v' + version, safe='')}/scu-plus-safari-macos.dmg)。若对应版本尚未生成，请联系维护者检查[构建状态](https://github.com/Visio-Vanitas/scu-plus/actions/workflows/safari-release-sync.yml)。\n\n"
        "iOS/iPadOS：[通过 TestFlight 安装](https://testflight.apple.com/join/VfB4puVJ)，可安装版本以 Apple 审核和当前测试状态为准，不保证同步更新。\n\n"
        f"另提供：[未签名 IPA](https://github.com/Visio-Vanitas/scu-plus/releases/download/{quote('v' + version, safe='')}/scu-plus-safari-ios-unsigned.ipa)，需自行重签主应用及 Safari 扩展。不建议任何不了解 IPA 的同学下载或尝试安装，不接受相关错误报告。\n\n"
        + get_release_notes(version)
    )
    print(release_notes)

    set_env("title", f"scu+ {version}")
    set_env("release_notes", release_notes)
