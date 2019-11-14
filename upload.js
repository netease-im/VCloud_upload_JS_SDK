/*global $,console,FileReader,md5*/
/*jslint white: true*/
/**
 * 文件上传SDK
 *     1、兼容性说明：
 *         仅兼容IE10+、Firefox、Chrome等支持slice和localStorage的浏览器。
 *     2、SDK依赖于jQuery和md5插件，请提前引入。
 *     3、执行getInitInfo初始化前需要先调用鉴权接口（应用服务器自行实现）：http://vcloud.163.com/docs/api.html（API token校验）。
 *     4、获取鉴权信息后，请修改getInitInfo函数，传入获取的鉴权信息，并修改AJAX回调实现。
 *     5、调用方法：Uploader().init({
 *         //配置对象，将覆盖默认配置
 *         fileInputId: '',
 *         fileUploadId: '',ajax
 *         getInitInfo: function(file, callback){
 *             ...
 *         }
 *         ...
 *     })
 *     其中，配置对象的fileInputId、fileUploadId、getInitInfo，以及所有onXxx等回调函数需要自行修改实现（以配置对象参数方式传入init函数）。
 * @module uploader
 * @class Uploader
 * @static
 * @param {Object} options 配置项对象
 * @return {Object} 接口对象
 * @author luoweiping
 * @version 1.0.0
 */
function Uploader(options) {
    'use strict';
    var defaults = {
        /**
         * 分片大小
         * @attribute trunkSize
         * @writeOnce
         * @type {Number}
         */
        trunkSize: 4 * 1024 * 1024,
        /**
         * 获取dns列表的URL
         * @attribute urlDns
         * @writeOnce
         * @type {String}
         */
        urlDns: 'http://wanproxy.127.net/lbs',
        /**
         * 上传输入框元素ID
         * @attribute fileInputId
         * @writeOnce
         * @type {String}
         */
        fileInputId: 'fileInput',
        /**
         * 上传按钮ID
         * @attribute fileUploadId
         * @writeOnce
         * @type {String}
         */
        fileUploadId: 'fileUpload',
        fileExts: ['JPG','PNG','WMV','ASF','AVI','3GP','MKV','MP4','DVD','OGM','MOV','MPG','MPEG','MPE','FLV','F4V','SWF','M4V','QT','DAT','VOB','RMVB','RM','OGM','M2TS','MTS','TS','TP','WEBM','MP3','AAC'],
        /**
         * 获取初始化信息
         *     发送请求到视频云服务端或应用服务器，参数见代码注释；
         *     其中，typeId和presetId需自行获取(接口文档暂未发布，请联系客服)，headers参数为API token校验返回的结果(必填)
         * @method fileUploadId
         * @static
         * @param  {Object}   file     文件对象
         *      fileKey: 对文件名和文件大小进行md5后的结果
         *      file: File对象
         *      fileName: 文件名（作为file.name的备份）
         *      fileSizeMb: 文件大小（MB）
         *      format: 文件后缀
         *      status: 上传状态（0：待上传，1：上传中；2：上传完成）
         *      checked: 是否选中（用于列表）
         *      progress: 上传进度
         * @param  {Function} callback 回调函数
         *      回调函数的参数包括：
         *      bucketName: 桶名
         *      objectName: 对象名
         *      nosToken: x-nos-token
         * @return {void}
         * @version 1.0.0
         */
        getInitInfo: function(file, callback) {
            var context;
            context = localStorage.getItem(file.fileKey + '_context');
            if (!context) {
                $.ajax({
                    type: 'post',
                    url: 'http://vcloud.163.com/app/vod/upload/init',
                    data: JSON.stringify({
                        originFileName: file.file.name,     //上传文件的原始名称(包含后缀名)(必填)(规则同Windows文件名规则)
                        userFileName: file.file.name,       //用户命名的上传文件名称(规则同Windows文件名规则)
                        typeId: null,                       //视频所属的类别ID
                        presetId: null,                     //视频所需转码模板ID
                        callbackUrl: null,                  //转码成功后回调客户端的URL地址
                        description: null                   //上传视频的描述信息
                    }),
                    //headers参数为API token校验返回的结果，全部均为必须
                    headers: {
                        'AppKey': '',   //开发者平台分配的appkey
                        'Nonce': '',    //随机数（随机数，最大长度128个字符）
                        'CurTime': '',  //当前UTC时间戳，从1970年1月1日0点0分0秒开始到现在的秒数
                        'CheckSum': ''  //服务器认证需要,SHA1(AppSecret+Nonce+CurTime),16进制字符小写
                    },
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function(data, s, xhr) {
                        /*
                            data格式：
                            "Content-Type": "application/json; charset=utf-8"
                            {
                                "code": 200,
                                "msg": "",
                                "ret": {
                                    "xNosToken": "xxsfsgdsgetret",
                                    "bucket": "origv10000",
                                    "object": "qrwr-eete-dsft-vdfg.mp4"
                                }
                            }
                        */
                        if (data.code === 200) {
                                localStorage.setItem(file.fileKey + '_bucket', data.ret.bucket);
                                localStorage.setItem(file.fileKey + '_object', data.ret.object);
                                localStorage.setItem(file.fileKey + '_xNosToken', data.ret.xNosToken);
                            callback({
                                'bucketName': data.ret.bucket,
                                'objectName': data.ret.object,
                                'nosToken': data.ret.xNosToken
                            });
                        } else {
                            opts.onError({
                                errCode: data.Code,
                                errMsg: data.msg
                            });
                        }
                    },
                    error: function(xhr, s, err) {
                        opts.onError(err);
                    }
                });
            } else {
                callback({
                    'bucketName': localStorage.getItem(file.fileKey + '_bucket'),
                    'objectName': localStorage.getItem(file.fileKey + '_object'),
                    'nosToken': localStorage.getItem(file.fileKey + '_xNosToken')
                });
            }
        },
        /**
         * 错误处理回调
         * @method onError
         * @static
         * @param  {Object} errObj 带errCode和errMsg的Object或XHR错误对象
         * @return {void}
         * @version 1.0.0
         */
        onError: function(errObj) {
            console.log(errObj);
        },
        /**
         * 上传进度回调
         * @method onProgress
         * @static
         * @param  {Object} curFile 文件对象
         * @return {void}
         * @version 1.0.0
         */
        onProgress: function(curFile) {
            console.log(curFile.status);
            console.log(curFile.progress);
        },
        /**
         * 单文件上传成功回调
         * @method onUploaded
         * @static
         * @param  {Object} curFile 文件对象
         * @return {void}
         * @version 1.0.0
         */
        onUploaded: function(service, curFile) {
            console.log('File: ' + curFile.fileName + ' is uploaded.');
            // 将文件信息存入上传成功列表
            service.successList.push(curFile);
            /**
             * 用于获取vid等信息，暂只支持在单个文件上传成功后的回调中进行
             * 在全部上传成功的回调中发起请求会导致在上传失败时无法执行请求（接口的URL、参数格式、响应格式等均相同）
             */
            $.ajax({
                type: 'post',
                url: 'http://vcloud.163.com/app/vod/video/query',
                data: JSON.stringify({
                    objectNames: [curFile.objectName]
                }),
                dataType: 'json',
                contentType: 'application/json',
                //headers参数为API token校验返回的结果，全部均为必须
                headers: {
                    'AppKey': '',   //开发者平台分配的appkey
                    'Nonce': '',    //随机数（随机数，最大长度128个字符）
                    'CurTime': '',  //当前UTC时间戳，从1970年1月1日0点0分0秒开始到现在的秒数
                    'CheckSum': ''  //服务器认证需要,SHA1(AppSecret+Nonce+CurTime),16进制字符小写
                },
                success: function(data, s, xhr) {
                    if(data.code === 200){
                        /**
                         * 根据需要进行处理，返回的data格式：
                         * "Content-Type": "application/json; charset=utf-8"
                         * {
                         *     "code" : 200,
                         *     "msg": "",
                         *     "ret" : {
                         *         "count": 1,
                         *         "list" : [{
                         *             "objectName" : "33cf71b1-86ac-4555-a071-d70db07b9685.mp4",
                         *             "vid" : 1008
                         *         },
                         *         ...
                         *         ]
                         *     }
                         * }
                         */
                    } else {
                        opts.onError({
                            errCode: data.Code,
                            errMsg: data.msg
                        });
                    }
                },
                error: function(xhr, s, err) {
                    opts.onError(err);
                }
            });
        },
        /**
         * 全部文件上传成功回调
         * @method onAllUploaded
         * @static
         * @return {void}
         * @version 1.0.0
         */
        onAllUploaded: function() {
            console.log('All done.');
        },
        /**
         * 文件添加成功回调
         * @method onAdd
         * @static
         * @param  {File} fileObj 文件对象
         * @return {void}
         * @version 1.0.0
         */
        onAdd: function(curFile) {
            console.log(curFile.file.name + ': ' + curFile.fileSizeMb + ' MB');
        },
        /**
         * 无文件上传时的处理函数
         * @method noUploadFn
         * @static
         * @return {void}
         * @version 1.0.0
         */
        noUploadFn: function() {
            console.log('请选择待上传的文件');
        },
        /**
         * 文件已存在列表中的处理函数
         * @method existFn
         * @static
         * @return {void}
         * @version 1.0.0
         */
        existFn: function() {
            console.log('文件已存在列表中');
        },
        /**
         * 文件格式不匹配的处理函数
         * @method existFn
         * @static
         * @return {void}
         * @version 1.0.0
         */
        mismatchFn: function() {
            $('#progressInfo').html('不是有效的视频或图片格式');
        }
    },
        opts,
        service;

    opts = $.extend({}, defaults, options);

    service = {
        /**
         * @property {Array} fileList 文件列表
         */
        fileList: [],
        /**
         * @property {Array} successList 上传成功的文件列表
         */
        successList: [],
        /**
         * @property {Array} dnsList DNS列表
         */
        dnsList: null,
        /**
         * 获取上传DNS地址
         * @method getDNS
         * @static
         * @param  {Object}   param    AJAX参数
         * @param  {Function} callback 成功回调
         * @return {void}
         * @version 1.0.0
         */
        getDNS: function(param, callback) {
            if (service.dnsList) {//已缓存则直接取缓存数据
                callback(service.dnsList);
            } else {
                $.ajax({
                    type: 'get',
                    url: opts.urlDns,
                    data: {
                        version: '1.0',
                        bucketname: param.bucketName
                    },
                    dataType: 'json',
                    success: function(data, s, xhr) {
                        if (data.code) {
                            opts.onError({
                                errCode: data.Code,
                                errMsg: data.Message
                            });
                        } else {
                            service.dnsList = data.upload;
                            callback(data.upload);
                        }
                    },
                    error: function(xhr, s, err) {
                        opts.onError(err);
                    }
                });
            }
        },
        /**
         * 删除文件，终止上传并从列表中移除（进度保持不变）
         * @method removeFile
         * @static
         * @param  {Object} file 文件对象
         * @return {void}
         * @version 1.0.0
         */
        removeFile: function(file) {
            $.each(service.fileList, function(i, v) {
                if (v.fileKey === file.fileKey) {
                    if (v.xhr) {
                        v.xhr.upload.onprogress = $.noop;
                        v.xhr.onreadystatechange = $.noop;
                        v.xhr.abort();

                        v.xhr = null;
                    }
                    service.fileList.splice(i, 1);

                    if (v.status === 1) {
                        service.upload(i);
                    }
                    return false;
                }
            });
        },
        /**
         * 根据fileKey获取指定文件对象
         * @method getFile
         * @static
         * @param  {String} fileKey 文件名和文件大小md5值
         * @return {Obejct}         文件对象
         * @version 1.0.0
         */
        getFile: function(fileKey) {
            var curFile;

            $.each(service.fileList, function(i, v) {
                if (v.fileKey === fileKey) {
                    curFile = v;
                    return false;
                }
            });

            return curFile;
        },
        /**
         * 上传分片
         * @method uploadTrunk
         * @static
         * @param  {Object}   param     AJAX参数
         * @param  {Object}   trunkData 分片数据
         * @param  {Function} callback  文件（非分片）上传成功回调函数
         * @return {void}
         * @version 1.0.0
         */
        uploadTrunk: function(param, trunkData, callback) {
            var xhr,
                xhrParam = '',
                curFile,
                context;
            curFile = service.getFile(trunkData.fileKey);
            context = localStorage.getItem(trunkData.fileKey + '_context');

            if (curFile.xhr) {
                xhr = curFile.xhr;
            } else {
                xhr = new XMLHttpRequest();
                curFile.xhr = xhr;
            }

            xhr.upload.onprogress = function(e) {
                var progress = 0;

                if (e.lengthComputable) {
                    progress = (trunkData.offset + e.loaded) / trunkData.file.size;
                    curFile.progress = (progress * 100).toFixed(2);

                    if (progress > 0 && progress < 1) {
                        curFile.status = 1;
                    } else if (progress === 1) {
                        curFile.status = 2;
                    }
                    localStorage.setItem(trunkData.fileKey + '_progress', curFile.progress);
                    opts.onProgress(curFile);
                } else {
                    opts.onError({
                        errCode: 501,
                        errMsg: '浏览器不支持进度事件'
                    });
                }
            };

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) {
                    return;
                }
                var result;
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (e) {
                    result = {
                        errCode: 500,
                        errMsg: '未知错误'
                    };
                }
                if (xhr.status === 200) {
                    if (!result.errCode) {
                        localStorage.setItem(trunkData.fileKey + '_context', result.context);

                        if (result.offset < trunkData.file.size) {//上传下一片
                            service.uploadTrunk(param, $.extend({}, trunkData, {
                                offset: result.offset,
                                trunkEnd: result.offset + trunkData.trunkSize,
                                context: context || result.context
                            }), callback);
                        } else {//单文件上传结束
                            callback(service, trunkData);
                        }
                    } else {
                        service.clearStorage(trunkData.fileKey);
                        opts.onError({
                            errCode: result.errCode,
                            errMsg: result.errMsg
                        });
                    }
                } else {
                    if(xhr.status){//nos error
                        service.clearStorage(trunkData.fileKey);
                    }
                    //取消、关闭情况
                    opts.onError(xhr.responseText);
                }
            };
            xhrParam = '?offset=' + trunkData.offset + '&complete=' + (trunkData.trunkEnd >= trunkData.file.size) + '&context=' + (context || trunkData.context) + '&version=1.0';

            xhr.open('post', param.serveIp + '/' + param.bucketName + '/' + param.objectName + xhrParam);
            xhr.setRequestHeader('x-nos-token', param.nosToken);
            xhr.send(trunkData.file.slice(trunkData.offset, trunkData.trunkEnd));
        },
        /**
         * 获取上传断点位置
         * @method getOffset
         * @static
         * @param  {Object}   param    AJAX参数
         * @param  {Function} callback 获取成功回调
         * @return {void}
         * @version 1.0.0
         */
        getOffset: function(param, callback) {
            var context;
            context = localStorage.getItem(param.fileKey + '_context');
            if (!context) {
                return callback(0);
            }
            $.ajax({
                type: 'get',
                url: param.serveIp + '/' + param.bucketName + '/' + param.objectName + '?uploadContext',
                data: {
                    version: '1.0',
                    context: context
                },
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-nos-token', param.nosToken);
                },
                success: function(data, s, xhr) {
                    if (data.errCode) {
                        opts.onError({
                            errCode: data.errCode,
                            errMsg: data.errMsg
                        });
                    } else {
                        callback(data.offset);
                    }
                },
                error: function(xhr, s, err) {
                    opts.onError(err);
                }
            });
        },
        clearStorage: function(fileKey){
            localStorage.removeItem(fileKey + '_progress');
            localStorage.removeItem(fileKey + '_context');
            localStorage.removeItem(fileKey + '_created');
            localStorage.removeItem(fileKey + '_bucket');
            localStorage.removeItem(fileKey + '_object');
            localStorage.removeItem(fileKey + '_xNosToken');
        },
        /**
         * 上传文件操作
         * @method upload
         * @static
         * @param  {Number} fileIdx 文件索引
         * @return {void}
         * @version 1.0.0
         */
        upload: function(fileIdx) {
            if (fileIdx < service.fileList.length) {
                if (service.fileList[fileIdx].status === 2 || !service.fileList[fileIdx].checked) {//上传完成或未勾选
                    return service.upload(fileIdx + 1);
                }
                opts.getInitInfo(service.fileList[fileIdx], function(data) {
                    var curFile = service.fileList[fileIdx];
                    curFile.objectName = data.objectName;
                    curFile.bucketName = data.bucketName;

                    service.getDNS(data, function(dnsList) {
                        var curFile = service.fileList[fileIdx];
                        service.getOffset({
                            serveIp: dnsList[0],
                            bucketName: data.bucketName,
                            objectName: data.objectName,
                            nosToken: data.nosToken,
                            fileKey: service.fileList[fileIdx].fileKey
                        }, function(offset) {
                            service.uploadTrunk({
                                serveIp: dnsList[0],
                                bucketName: data.bucketName,
                                objectName: data.objectName,
                                nosToken: data.nosToken
                            }, {
                                file: service.fileList[fileIdx].file,
                                fileKey: service.fileList[fileIdx].fileKey,
                                fileIdx: fileIdx,
                                offset: offset || 0,
                                trunkSize: opts.trunkSize,
                                trunkEnd: (offset || 0) + opts.trunkSize,
                                context: ''
                            }, function(trunkData) {
                                service.clearStorage(trunkData.fileKey);
                                opts.onUploaded(service, curFile);
                                service.upload(fileIdx + 1);
                            });
                        });
                    });
                });
            } else {
                opts.onAllUploaded();
            }
        },
        /**
         * 添加文件
         * @method addFile
         * @static
         * @param {Element}   fileInput 上传输入框元素
         * @param {Function} callback  添加成功回调
         * @return {void}
         * @version 1.0.0
         */
        addFile: function(fileInput, callback) {
            var file = fileInput.files[0],
                fileKey = md5(file.name + ':' + file.size),
                fileObj;
            
            fileObj = {
                fileKey: fileKey,
                file: file,
                fileName: file.name,
                fileSizeMb: (file.size / 1024 / 1024).toFixed(2),
                format: file.name.split('.').pop(),
                status: 0,
                checked: true,
                progress: localStorage.getItem(fileKey + '_progress') || 0
            };
            service.fileList.push(fileObj);
            localStorage.setItem(fileKey + '_created', +new Date());
            callback(fileInput, fileObj);
        },
        /**
         * 判断文件是否已存在列表中
         * @method checkExist
         * @static
         * @param  {File} file File对象
         * @return {Boolean}      存在：true，不存在：false
         * @version 1.0.0
         */
        checkExist: function(file) {
            var exist = false,
                curKey = md5(file.name + ':' + file.size);
            $.each(service.fileList, function(i, v) {
                if (curKey === v.fileKey) {
                    exist = true;
                    return false;
                }
            });
            return exist;
        },
        /**
         * 判断是否有待上传（已选中且上传未完成）的文件
         * @method checkedPending
         * @static
         * @return {Boolean} 有：true，无：false
         * @version 1.0.0
         */
        checkedPending: function() {
            var checked = false;
            $.each(service.fileList, function(i, v) {
                if (v.checked && v.status === 0) {
                    checked = true;
                    return false;
                }
            });
            return checked;
        },
        /**
         * 事件绑定
         * @method initEvent
         * @static
         * @return {void}
         * @version 1.0.0
         */
        initEvent: function() {
            $('#' + opts.fileInputId).on('change', function(e) {
                var fileExt = '';
                if (e.target.files) {
                    if (!service.checkExist(e.target.files[0])) {
                        fileExt = e.target.files[0].name.split('.').pop();
                        fileExt = fileExt.toUpperCase();
                        if($.inArray(fileExt, opts.fileExts) < 0){
                            return opts.mismatchFn();
                        }
                        service.addFile(e.target, function(fileInput, fileObj) {
                            opts.onAdd(fileObj);
                            fileInput.value = '';
                        });
                    } else {
                        this.value = '';
                        opts.existFn();
                    }
                }
            });
            $('#' + opts.fileUploadId).on('click', function() {
                if (!service.checkedPending()) {
                    opts.noUploadFn();
                    return false;
                }
                localStorage.clear()
                service.upload(0);
                return false;
            });
        },
        /**
         * 初始化
         * @method init
         * @static
         * @return {void}
         * @version 1.0.0
         */
        init: function() {
            service.initEvent();
        }
    };

    return service;
}
