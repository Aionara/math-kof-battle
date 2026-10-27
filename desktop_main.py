# -*- coding: utf-8 -*-
"""拳皇·数学格斗 - 桌面启动器"""
import os
import sys
import webview


def resource_path(rel: str) -> str:
    """获取资源文件绝对路径（兼容 PyInstaller 打包后的临时目录）"""
    if hasattr(sys, "_MEIPASS"):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, rel)


def main():
    index = resource_path("index.html")
    icon_path = resource_path("icon.ico")
    webview.create_window(
        "拳皇·数学格斗",
        url=index,
        width=1280,
        height=800,
        resizable=True,
        text_select=False,
        confirm_close=False,
    )
    webview.start(icon=icon_path)


if __name__ == "__main__":
    main()
