/**
 * Date format
 * @param {String} fmt format
 * @returns {String} format date
 */
Date.prototype.format = function (fmt) {
  let o = {
    'M+': this.getMonth() + 1, //月份 
    'd+': this.getDate(), //日 
    'h+': this.getHours(), //小时 
    'm+': this.getMinutes(), //分 
    's+': this.getSeconds(), //秒 
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度 
    'S': this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
};

/**
 * 初始化 leancloud-storage 對象<br/>
 * 替換為自己的 appId, appKey, serverURL
 */
AV.init({
  appId: 'S2fJ4HuOfyF5zuDGNuKi6maF-gzGzoHsz',
  appKey: 'dRCwn1pyg4DBXiw06kchF3KB',
  serverURL: 'https://s2fj4huo.lc-cn-n1-shared.com'
});
//leancloud-storage Bill 查詢對象
let queryBill = new AV.Query('Bill');
//消費類型
const PAY_TYPE = {0: '汪成,張弛', 1: '汪成,李瑞豪', 2: '張弛,李瑞豪', 3: '汪成,張弛,李瑞豪'};
// 付款人
const PAY_USER = {0: '汪成', 1: '張弛', 2: '李瑞豪'};

/**
 * Bill's Vue App
 */
new Vue({
  el: '#bill',
  data: {
    load:{
      more: false,
      start: 0, //开始查询位置
      count: 15, //每次查詢筆數
      offset: 0
    },
    monthBill: {
      payType0: 0, payType1: 0, payType2: 0, payType3: 0, payUser0: 0, payUser1: 0, payUser2: 0
    },
    bills: [],
    month: new Date().format('yyyy-MM'),
    hideWc: false
  },
  computed: {
    monthTotalBill: function(){
      return (this.monthBill.payUser0 + this.monthBill.payUser1 + this.monthBill.payUser2).toFixed(2);
    },
    wcBill: function(){
      return this.countBill(this.monthBill.payType0 + this.monthBill.payType1);
    },
    zcBill: function(){
      return this.countBill(this.monthBill.payType0 + this.monthBill.payType2);
    },
    lrhBill: function(){
      return this.countBill(this.monthBill.payType1 + this.monthBill.payType2);
    }
  },
  watch: {
    month: function(month){
      this.getMonthBill();
      // 2020年5月汪成搬走
      this.hideWc = month < '2021-06';
    }
  },
  methods: {
    /**
     * 獲取歷史消費記錄數據
     */
    getBillData: function() {
      let billVm = this;
      queryBill.descending('createdAt')
        .skip(billVm.load.start * billVm.load.count + billVm.load.offset).limit(billVm.load.count)
        .find().then(function (response) {
          let billLength = response.length;
          if(billLength > 0){
            billVm.load.more = billLength === billVm.load.count;
            for(bill of response){
              billVm.bills.push({
                pay: bill.attributes.pay,
                payType: PAY_TYPE[bill.attributes.pay_type],
                payUser: PAY_USER[bill.attributes.pay_user],
                payDescription: bill.attributes.pay_description,
                payDt: new Date(bill.createdAt).format('yyyy-MM-dd hh:mm:ss')
              })
            }
          } else {
            billVm.load.more = false;
          }
      });
    },
    /**
     * 獲取月賬單數據
     */
    getMonthBill: function(){
      let billVm = this;
      let baseDt = new Date().format(`${billVm.month.replace('-','/')}/01 00:00:00`);
      let startMonth = new Date(baseDt);
      let nextMonth = new Date(new Date(baseDt).setMonth(startMonth.getMonth() + 1));
      let startDateQuery = new AV.Query('Bill');
      startDateQuery.greaterThanOrEqualTo('createdAt', startMonth);
      let endDateQuery = new AV.Query('Bill');
      endDateQuery.lessThan('createdAt', nextMonth);
      let MonthBillQuery = AV.Query.and(startDateQuery, endDateQuery);
      MonthBillQuery.find().then(function(response){
        for(let key in billVm.monthBill){
          billVm.monthBill[key] = 0;
        }
        for(bill of response){
          let {pay, pay_type, pay_user} = bill.attributes;
          billVm.monthBill[`payType${pay_type}`] += pay;
          billVm.monthBill[`payUser${pay_user}`] += pay;
        }
      });
    },
    loadMore: function () {
      if (this.load.more) {
        this.load.start++;
        this.getBillData();
      }
    },
    countBill: function(twins){
      return (twins/2 + this.monthBill.payType3/3).toFixed(2);
    },
    toFixed: function(num){
      return Number(num).toFixed(2);
    }
  },
  created: function(){
    console.warn('青山不改，綠水長流，兄弟們江湖再見！');
  },
  mounted: function(){
    let billVm = this;
    //默認顯示當前月份統計數據
    billVm.getMonthBill();
    //加載消費記錄
    billVm.getBillData();
    /**
     * 記賬提交按鈕事件監聽
     */
    document.querySelector('.submit').addEventListener('click', function(event){
      event.preventDefault();
      let formPay = document.querySelector('#form-pay');
      let bill = new AV.Object('Bill');
      let payValue = Number(formPay.pay.value);
      let payType = Number(formPay.pay_type.value);
      let payUser = Number(formPay.pay_user.value);
      let payDescription = formPay.pay_description.value;
      if(payValue === 0){
        //不可能是我哈哈哈哈
        //return alert(`又没写金额！我猜是${PAY_USER[Math.floor(Math.random()*2)]}。`);
        return alert('又没写金额哦！');
      }
      if(!payDescription){
        return alert('北鼻，买了啥描述一下嘛~');
      }
      bill.set('pay', payValue);
      bill.set('pay_type', payType);
      bill.set('pay_user', payUser);
      bill.set('pay_description', payDescription);
      bill.save().then((object) => {
        billVm.monthBill[`payType${payType}`] += payValue;
        billVm.monthBill[`payUser${payUser}`] += payValue;
        let billHistory = document.querySelector('.bill-history')
        billHistory.innerHTML =
          `<li>
             <div>${new Date().format('yyyy-MM-dd hh:mm:ss')}</div>
             <p class="bill-description">${payDescription}</p>
             <span>${PAY_TYPE[payType]}</span>,
             消费 <strong>${payValue}</strong> 元, <span>付款: ${PAY_USER[payUser]}</span>
          </li>` + billHistory.innerHTML;
        billVm.load.offset++;
        formPay.reset();
      }, (function (error) {
        console.error(JSON.stringify(error));
        alert('完蛋保存失敗了，网络不好吧！');
      }))
    });
  }
});