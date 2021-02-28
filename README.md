# Preparation
去 leancloud 创建一个应用，再新增一个 Bill Class, 补充一下字段：
| name | type   | description |
| ---  | ---    | ---     |
| pay  | Number | 消费金额 |
| pay_description | String | 消费描述 |
| pay_type | String | 消费类型 |
| pay_user | String | 付款人 |

# Init
set for yourself.
```
AV.init({
    appId: '',
    appKey: '',
    serverURL: ''
  });
```

# Push
push the `bill.html` to web server.

# 技术栈
- leancloud-storage
- Vue.js
- HTML,CSS,JS
