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
        f"macOS Safari：[下载对应版本](https://github.com/Visio-Vanitas/scu-plus/releases/tag/{quote('v' + version, safe='')})，由独立分发仓库签名和公证。上游发布后需要等待构建完成；若对应版本尚未生成，请查看[构建状态](https://github.com/Visio-Vanitas/scu-plus/actions/workflows/safari-release-sync.yml)。\n\n"
        "**不建议任何不了解 IPA 的同学下载或尝试安装。** iOS/iPadOS：上述分发页提供未签名 IPA，需自行重签主应用及 Safari 扩展后安装，仅供技术测试；原生断点调试请从源码构建。也可通过 [TestFlight](https://testflight.apple.com/join/VfB4puVJ) 邀测，安装取决于审核和当前测试状态。\n\n"
        + get_release_notes(version)
    )
    print(release_notes)

    set_env("title", f"scu+ {version}")
    set_env("release_notes", release_notes)
