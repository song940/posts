---
layout: post
title: "The Future Of Web Development"
---

# 我眼中的前端技术发展方向

## 一、React 没有未来

React 解决了什么问题？

- 组件化的问题
- 引入了虚拟 DOM 优化渲染

组件化的问题 Web Component 已经在路上了，终将有一个标准化的实现。

我们知道，VirtualDOM 可以一定程度上优化 DOM 渲染性能，但是在浏览器层面上 DOM 渲染性能本身就已经在优化了，React 中使用 VirtualDOM 来优化性能问题，这个问题很大程度上是 React 自己造成的。浏览器本身 DOM 性能已经很高了。当然我们也要知道 React VirtualDOM 不只是为了解决渲染问题，也为了能够实现渲染层抽象，适配更多的渲染引擎。

## 二、Webpack 没有未来

我们之所以使用 Webpack 来打包主要是解决两个问题：

- 模块化
- 合并文件以降低创建网络链接对页面加载性能的影响

随着 HTTP/2/3/QUIC 的发展，连接复用技术已经可以实现，即使在页面上写多个相同域的多个 script 标签也只会创建一个 TCP 链接，而且支持交叉数据传递，对网络加载性能影响很小。

目前很多 CDN 厂商都已经部署了 HTTP/2（\w QUIC）协议，毕竟对他们来说也是一个节省开销的好事情。

其次，浏览器对于 ES Module 已经支持的很好了，而且从社区支持来看越来越多的 Library 都输出了符合 ESM 规范的打包格式。而且 ESM 相比于其他打包格式还有一些诸如减少JS VM 虚拟机计算量等额外优势，没有理由不支持。

**没有了 Webpack TypeScript 怎么办？**

如果没有了 Webpack，那么 TypeScript 可以通过 WebAssembly 在浏览器端解析和执行，无需预编译执行。

## 三、小程序没有未来

虽然目前小程序已经很流行，但是 Service Worker 和 Offline App 的广泛应用是迟早的事情。

小程序总是想着向 Native 的方向努力，最终很可能会变成 Native 开发的一种方式，而非 Web 的未来。

虽然小程序为开发者提供了一种简单、快速的开发方式，但它并没有实现重大创新。

## 我眼中的未来是什么？

**回归标准：**我在讲某个东西没有未来并不是说否定它存在的意义，在特定的时期下它们的存在是非常重要的，它们加速了 Web 发展进程功不可没，但是缺乏标准化总是在解决一个问题的同时带来了非常多衍生的其他问题，这就是**工程化实践**和**标准化实践**的区别。

**大道至简：**想想看，我们现在要开始做一个 Web 应用要做那些事情？安装一大堆的框架、工具库、工具链、打包编译工具，每修改一个文件都要等待漫长的编译，每次发布都要经过复杂的工作流程来确保与开发时的预期一致。我认为未来不是这样，就应该是开箱即用，唾手可得，且性能优异。
