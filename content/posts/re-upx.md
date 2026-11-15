## 工具

- [x64dbg](https://x64dbg.com/)：调试器
- [Scylla](https://github.com/NtQuery/Scylla)：IAT 修复
- IDA：自己买或凝聚力
- [CFF Explorer](https://ntcore.com/explorer-suite/)：改 PE 属性
- [DIE](https://github.com/horsicq/Detect-It-Easy)：查壳

## 操作

- IDA 分析发现大量未被定义成代码的数据
- DIE 分析发现有 UPX 壳

![DIE 查壳结果](assets/media/posts/re-upx/image.png)

- 进入 x64dbg，设置入口断点（选项 → 选项 → 入口断点），运行到入口断点处

![设置入口断点](assets/media/posts/re-upx/image-1.png)

- 发现大量的 push（壳的特征之一），这是为了保存原始执行环境
- 运行到最后一个 push，在栈界面的 rsp 所在位置下硬件断点（访问）64 位
- 运行

![硬件断点命中](assets/media/posts/re-upx/image-2.png)

- 有多个 pop，说明壳已经解出来了
- 发现一个大跳，大跳符号为红色的 `-`，大跳后的地址多为 OEP 地址，记下

![定位 OEP](assets/media/posts/re-upx/image-3.png)

- （x64dbg 在运行）打开 Scylla，找到你分析的这个文件的进程，设置 OEP
- 第四步经常会扫过头，表现为完成第五步后出现红叉

![Scylla 扫描结果](assets/media/posts/re-upx/image-4.png)

- 此时只需把标红的文件删去即可

![删除标红项](assets/media/posts/re-upx/image-5.png)

- 此时 fix dump 的文件大概率是无法运行的，要用 CFF 进行修复

![CFF 打开文件](assets/media/posts/re-upx/image-6.png)

- 上图为放弃重定位的操作

![放弃重定位](assets/media/posts/re-upx/image-7.png)

- 上图为关闭地址随机化的操作

![关闭 ASLR](assets/media/posts/re-upx/image-8.png)

- 此时就完成了，能正常运行并进行 IDA 分析了

```note 提示
这套流程只适用于最朴素的 UPX 壳。遇到改过入口、带反调试的变种，第三步的硬件断点和第五步的 IAT 扫描通常都要另找方法。
```
