# VCloud_upload_JS_SDK
云信点播上传js SDK

## 1 简介
JavaScript-SDK是用于浏览器端点播上传的软件开发工具包，提供简单、便捷的方法，方便用户开发上传视频或图片文件的功能。

## 2 功能特性
1. 文件上传
2. 断点续传
3. 多文件状态管理

## 3 开发准备
文件上传依赖jQuery和md5加密库，因此需要提前引入JS文件：

```js
<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.3.js"></script>
<script type="text/javascript" src="https://blueimp.github.io/JavaScript-MD5/js/md5.js"></script>
<script type="text/javascript" src="http://nos.netease.com/vod163/upload.js"></script>
```

## 4 使用说明
### 4.1 参数设置
关联文件选择输入框和上传按钮元素ID，作为配置项参数传入Uploader：

```js
var opt = {
    fileInputId: 'fileInput',
    fileUploadId: 'fileUploadBtn'
}
```

**其他配置项说明：**

1. trunkSize：分片大小，最大4MB
2. fileExts：允许上传的文件类型后缀列表（字符串数组）
3. getInitInfo：获取初始化信息，包括：桶名、对象名、token等
4. onError：错误处理函数
5. onProgress：上传进度回调处理函数
6. onUploaded：单文件上传成功的回调函数
7. onAllUploaded：全部文件上传成功的回调函数
8. onAdd：文件添加成功的回调函数
9. noUploadFn：无文件上传时的处理函数
10. exsitFn：文件已存在（待上传）列表中的处理函数
11. mismatchFn：文件格式不匹配的处理函数

具体描述参见：**配置项API**。

### 4.2 初始化
确定配置参数后，通过以下调用进行事件的绑定和相关初始化操作：

```js
<script type="text/javascript">
    Uploader(opt).init();
</script>
```

### 4.3 文件上传
完成上述步骤后，即完成所有的上传接口调用。当用户选择上传文件后，将通过相关事件完成文件的上传。

### 4.4 断点续传
当文件上传中断后，用户只需重新选择文件提交即可恢复上传（可自定义文件队列和状态管理）。

## 5 配置项API
详细规格参见文档注释。
### 5.1 getInitInfo
该方法需要以下数据：

    'AppKey'   -> 开发者平台分配的appkey
    'Nonce'    -> 随机数（随机数，最大长度128个字符）
    'CurTime'  -> 当前UTC时间戳，从1970年1月1日0点0分0秒开始到现在的秒数
    'CheckSum' -> 服务器认证需要,SHA1(AppSecret+Nonce+CurTime),16进制字符小写

参数：

名称|类型|说明
:----|:----|:----
file|Object|文件对象
callback|Function|回调函数

返回值：

无

### 5.2 onError
参数：

名称|类型|说明
:----|:----|:----
errObj|Object|带errCode和errMsg的Object或XHR错误对象

返回值：

无

### 5.3 onProgress
参数：

名称|类型|说明
:----|:----|:----
curFile|Object|文件对象

返回值：

无

### 5.4 onUploaded
参数：

名称|类型|说明
:----|:----|:----
curFile|Object|文件对象

返回值：

无

### 5.5 onAllUploaded
参数：

无

返回值：

无

### 5.6 onAdd
参数：

名称|类型|说明
:----|:----|:----
curFile|Object|文件对象

返回值：

无

### 5.7 noUploadFn
参数：

无

返回值：

无

### 5.8 existFn
参数：

无

返回值：

无

### 5.9 mismatchFn
参数：

无

返回值：

无
