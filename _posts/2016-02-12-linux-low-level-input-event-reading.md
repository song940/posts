---
layout: post
title: Linux Low-level Input Event Reading
comments: true
---

在 PC 上看视频和听音乐时，如果距离比较远想去控制音量、播放进度、暂停继续等操作就比较麻烦

**我就在想，如果 PC 也能支持遥控器就好了**

遥控器每个人家里都有很多，空调、电视、电视盒子 基本都是红外发射器(IR)

刚好手里还有个之前买的 [CubieBoard](http://cubieboard.org) 它上面是有 IR Receiver 接收器的

![](https://ae01.alicdn.com/kf/HTB1sR.MJpXXXXczXVXXq6xXFXXXt/Cubietech-Cubietruck-Cubieboard-3-Dual-Core-A20-Board-2GB-DDR3-8G-NAND-Wifi-BT-MINI-PC.jpg_.webp)

https://wiki.lsong.org/cubietruck

Linux 中设备以文件形式存在, 当插入一个「可提供输入的设备」时, Kernel 会在 `/dev/input/` 目录下产生一个 `char` 类型文件。

```shell
➜  ~  ls -l /dev/input/
total 0
drwxr-xr-x 2 root root     60 Feb 10 13:03 by-path
crw-r----- 1 root root 13, 64 Feb 10 13:03 event0
crw-r----- 1 root root 13, 65 Feb 10 13:03 event1
crw-r----- 1 root root 13, 63 Feb 10 13:03 mice
```

通过 `cat` 命令可以读取该设备输入的数据流, 为了使数据流可读我们可以使用 `hexdump` 命令将数据流以 `hex` 形式显示。

```bash
➜  ~  cat /dev/input/event0 | hexdump
```

当我按下(并松开)一个按键时, 我的到了下面的输出:

```
➜  ~  cat /dev/input/event0 | hexdump
0000000 5d77 56bd eb98 0005 0001 0007 0001 0000
0000010 5d77 56bd eba3 0005 0000 0000 0000 0000
0000020 5d77 56bd bc16 0009 0001 0007 0000 0000
0000030 5d77 56bd bc1e 0009 0000 0000 0000 0000
```
不同的按键会产生不同的输出, 我们来看看 [Kernel](https://www.kernel.org/doc/Documentation/input) 中对 `Input` 的数据结构定义:

```c
struct input_event {
  struct timeval time;
  unsigned short type;
  unsigned short code;
  unsigned int value;
};
```

```c
struct timeval
{
  __time_t tv_sec;
  __suseconds_t tv_usec;
};
```

+ `time`: 时间戳, 表明事件发生的时间
+ `type`: 事件类型, eg: `EV_KEY`
+ `code`: 事件编码 eg: `KEY_BACKSPACE`
+ `value`: 事件值 eg: `1(keypress)`

```
<Buffer a4 3e 5b 51 ab cf 03 00 04 00 04 00 2c 00 07 00>
       |   tv_sec  |  tv_usec  |type |code |   value   |
```

有了这个数据结构之后我们就可以以数据流的形式读取它们，并转换为相应的结构。

解析流程比较复杂，可以看下代码：

```js
// source from: https://github.com/song940/input-event/blob/master/lib/index.js#L51-L76
process(buf) {
  var ev;
  /**
   * Sometimes (modern Linux), multiple key events will be in the triggered at once for the same timestamp.
   * The first 4 bytes will be repeated for every event, so we use that knowledge to actually split it.
   * We assume event structures of 3 bytes, 8 bytes, 16 bytes or 24 bytes.
   */
  if (buf.length > 8) {
    var t = buf.readUInt32LE(0);
    var lastPos = 0;
    for (var i = 8, n = buf.length; i < n; i += 8) {
      if (buf.readUInt32LE(i) === t) {
        var part = buf.slice(lastPos, i);
        ev = this.parse(part);
        if (ev) this.emit('data', ev, part);
        lastPos = i;
      }
    }
    var part = buf.slice(lastPos, i);
    ev = this.parse(part);
    if (ev) this.emit('data', ev, part);
  } else {
    ev = this.parse(buf);
    if (ev) this.emit('data', ev, buf);
  }
}
```

我把这个解析逻辑封装成 npm package 发布在 http://npmjs.org/input-event 了

经过社区开发者的贡献，我们现在已经支持对 键盘、鼠标、遥控器、游戏控制器和编码旋钮的支持了。

接下来就是把从遥控器接收并解析出来的按键信息发送给 PC 再转换成按键

```js
const dgram      = require('dgram');
const InputEvent = require('input-event');

var remote = new InputEvent.Keyboard('/dev/input/event0');

var udp = dgram.createSocket('udp4');

remote.on('keypress', function(ev){
  console.log(ev.code);
  var buf = new Buffer('code:' + ev.code);
  udp.send(buf, 0, buf.length, 1989, '255.255.255.255');
});
```

我们实现了红外接收遥控器按键，将按键 code 封装成 UDP 数据包广播到局域网中所有的设备上，这样就不用事先配置接收端的 IP 地址了。

```csharp
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;

namespace RemoteControlServer
{
    class RemoteServer
    {
        const int VOLUME_UP   = 175;
        const int VOLUME_DOWN = 174;

        static void Main(string[] args)
        {
            var endpoint = new IPEndPoint(IPAddress.Any, 1989);
            UdpClient server = new UdpClient(endpoint);
            Console.WriteLine("Remote Server is running at 1989 .");
                        
            while (true)
            {
                var sender = new IPEndPoint(IPAddress.Any, 0);
                var data = server.Receive(ref sender);
                string message = Encoding.ASCII.GetString(data, 0, data.Length);
                Console.WriteLine("{0}: {1}", sender, message);
                switch (message)
                {
                    case "code:7":
                        for(var i = 0; i < 10; i++) keybd_event((byte)VOLUME_DOWN, 0, 0, 0);
                        break;
                    case "code:9":
                        for (var i = 0; i < 10; i++) keybd_event((byte)VOLUME_UP, 0, 0, 0);
                        break;
                    case "code:69":
                        Process.Start("shutdown", "/s /t 0");
                        break;
                }
            }
        }

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    }
}
```

在接收端我们监听 1989 端口上的 UDP 报文，根据按键的 code 执行对应的动作，模拟按键用到了 win32 API, 上面的例子主要实现了调整音量和关机操作，想要实现更多功能也比较简单，这里就不再详述了，大家可以根据自己的需求来调整。