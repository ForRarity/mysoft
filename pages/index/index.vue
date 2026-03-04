<template>
    <view class="container">
        <!-- 包含两个输入框的大框 -->
        <view class="input-group">
            <!-- 售价行：标签 + 输入框 -->
            <view class="input-row">
                <text class="label">售价</text>
                <view class="price-input-wrapper">
                    <text class="currency-symbol">¥</text>
                    <input 
                        type="number" 
                        v-model="numberValue" 
                        placeholder="请输入售价" 
                        class="input-box price-input"
                        @input="onInputChange"
                    />
                </view>
            </view>
            
            <!-- 方案行：标签 + 下拉框 -->
            <view class="input-row">
                <text class="label">方案</text>
                <picker @change="onPickerChange" :value="pickerIndex" :range="pickerOptions" class="picker-wrapper">
                    <view class="picker-box" :class="{ 'placeholder': pickerIndex === -1 }">
                        {{ pickerIndex >= 0 ? pickerOptions[pickerIndex] : '请选择方案' }}
                    </view>
                </picker>
            </view>
        </view>
        
        <!-- 费用总览大框 - 仅在点击计算后显示 -->
        <view class="summary-group" v-if="showResult">
            <view class="summary-title">费用总览</view>
            <view class="summary-row">
                <text class="summary-label">费率:</text>
                <text class="summary-value">{{ feeRate }}</text>
            </view>
            <view class="summary-row">
                <text class="summary-label">总租金:</text>
                <text class="summary-value">{{ totalRent }}</text>
            </view>
            <view class="summary-row">
                <text class="summary-label">首付金额:</text>
                <text class="summary-value">{{ downPayment }}</text>
            </view>
        </view>
		
		<!-- 账单详情大框 - 仅在点击计算后显示 -->
		<view class="summary-group" v-if="showResult">
		    <view class="summary-title">账单详情</view>
		    <view class="summary-row" v-for="(item, index) in billDetails" :key="index">
		        <view class="bill-label-wrapper">
		            <text class="summary-label">第{{ index + 1 }}期</text>
		            <text v-if="getBillTag(index)" class="bill-tag" :class="getBillTagClass(index)">{{ getBillTag(index) }}</text>
		        </view>
		        <text class="summary-value">{{ item }}</text>
		    </view>
		</view>
        
        <!-- 开始计算按钮 - 始终固定在底部 -->
        <view class="fixed-bottom">
            <button type="primary" class="calculate-btn" @click="handleCalculate">开始计算</button>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            numberValue: '',        // 绑定的数字输入值
            pickerOptions: ['首付20%|费率20%|6期', '首付30%|费率17%|6期', '首付35%|费率15%|6期','首付40%|费率14%|6期','首付50%|费率10%|6期'],
            pickerIndex: -1,         // -1 表示未选中任何项
            showResult: false,        // 控制费用总览和账单详情显示
            // 费用总览数据
            feeRate: '--',
            totalRent: '--',
            downPayment: '--',
            // 账单详情数据
            billDetails: [],
            // 标记用户是否正在修改输入
            isUserEditing: false
        }
    },
    methods: {
        // 获取账单标签
        getBillTag(index) {
            if (this.pickerIndex === -1 || !this.showResult) return '';
            
            const period = index + 1; // 期数从1开始
            
            // 方案1: 首付20%|费率20%|6期
            if (this.pickerIndex === 0) {
                if (period === 1) return '首期金额';
            }
            // 方案2、3、4: 首付30%、35%、40%
            else if (this.pickerIndex === 1 || this.pickerIndex === 2 || this.pickerIndex === 3) {
                if (period === 1) return '首期金额';
                if (period === 6) return '尾期金额';
            }
            // 方案5: 首付50%|费率10%|6期
            else if (this.pickerIndex === 4) {
                if (period === 1) return '首期金额';
                if (period === 5) return '中期金额';
                if (period === 6) return '尾期金额';
            }
            
            return '';
        },
        // 获取账单标签的样式类
        getBillTagClass(index) {
            const tag = this.getBillTag(index);
            if (tag === '首期金额') return 'bill-tag-first';
            if (tag === '中期金额') return 'bill-tag-middle';
            if (tag === '尾期金额') return 'bill-tag-last';
            return '';
        },
        // 当下拉框选择改变时触发
        onPickerChange(e) {
            this.pickerIndex = e.detail.value;
            this.isUserEditing = true;
            // 更改方案时清空下方结果
            this.showResult = false;
            // 同时清空费用总览和账单详情数据
            this.feeRate = '--';
            this.totalRent = '--';
            this.downPayment = '--';
            this.billDetails = [];
        },
        // 输入框变化时，仅标记用户正在编辑，不隐藏结果
        onInputChange() {
            this.isUserEditing = true;
            // 修改售价时保留之前计算的结果，不清空
        },
        // 点击“开始计算”按钮，执行计算并显示结果
        handleCalculate() {
            // 重置用户编辑标记
            this.isUserEditing = false;
            
            // 第一步：验证输入值
            if (!this.validateInput()) {
                return;
            }
            
            // 第二步：验证是否选择了方案
            if (this.pickerIndex === -1) {
                uni.showToast({
                    title: '请选择方案',
                    icon: 'none',
                    duration: 2000
                });
                // 如果之前没有结果显示，才隐藏；否则保留之前的结果
                if (!this.showResult) {
                    this.showResult = false;
                }
                return; // 直接返回，不进行计算
            }
            
            // 第三步：验证都通过，更新费用总览和账单详情
            this.updateSummaryFields();
            this.showResult = true;
        },
        // 验证输入值的函数
        validateInput() {
            const num = parseFloat(this.numberValue);
            
            // 检查是否为空
            if (this.numberValue === '') {
                uni.showToast({
                    title: '请输入售价',
                    icon: 'none',
                    duration: 2000
                });
                return false;
            }
            
            // 检查是否为有效数字
            if (isNaN(num)) {
                uni.showToast({
                    title: '请输入有效的数字',
                    icon: 'none',
                    duration: 2000
                });
                return false;
            }
            
            // 检查是否小于等于0
            if (num <= 0) {
                uni.showToast({
                    title: '输入的售价必须大于0',
                    icon: 'none',
                    duration: 2000
                });
                return false;
            }
            
            return true;
        },
        // 格式化数字为保留两位小数的金额
        formatCurrency(value) {
            return '¥' + value.toFixed(2);
        },
        // 格式化费率为百分比（不包含"费率"文字）
        formatFeeRate(percent) {
            return percent.toFixed(2) + '%';
        },
        // 更新费用总览和账单详情字段
        updateSummaryFields(forceUpdate = true) {
            const num = parseFloat(this.numberValue) || 0;
            
            // 解析选中的方案字符串
            if (this.pickerIndex >= 0) {
                const selectedOption = this.pickerOptions[this.pickerIndex];
                // 解析格式：'首付20%|费率20%|6期'
                const parts = selectedOption.split('|');
                
                // 1. 费率：从方案中提取百分比数字，然后格式化为XX.00%
                let feePercent = 0;
                if (parts.length >= 2) {
                    const feeMatch = parts[1].match(/(\d+)%/);
                    if (feeMatch) {
                        feePercent = parseInt(feeMatch[1]) / 100;
                        this.feeRate = this.formatFeeRate(feePercent * 100);
                    } else {
                        this.feeRate = '--';
                    }
                } else {
                    this.feeRate = '--';
                }
                
                // 2. 总租金 = 售价 * (1 + 费率)
                const totalRentValue = num * (1 + feePercent);
                this.totalRent = this.formatCurrency(totalRentValue);
                
                // 3. 首付金额 = 售价 * 首付比例
                let downPaymentPercent = 0;
                let downPaymentValue = 0;
                if (parts.length >= 1) {
                    const downPaymentMatch = parts[0].match(/(\d+)%/);
                    if (downPaymentMatch) {
                        downPaymentPercent = parseInt(downPaymentMatch[1]) / 100;
                        downPaymentValue = num * downPaymentPercent;
                        this.downPayment = this.formatCurrency(downPaymentValue);
                    } else {
                        this.downPayment = '--';
                    }
                } else {
                    this.downPayment = '--';
                }
                
                // 4. 根据不同的方案计算账单详情
                this.billDetails = [];
                
                // 方案1: 首付20%|费率20%|6期
                if (this.pickerIndex === 0) {
                    // 第一期到第六期都等于 输入的售价 * 0.2
                    const periodAmount = num * 0.2;
                    for (let i = 0; i < 6; i++) {
                        this.billDetails.push(this.formatCurrency(periodAmount));
                    }
                }
                // 方案2: 首付30%|费率17%|6期
                else if (this.pickerIndex === 1) {
                    // 第二期到第五期都等于 （总租金-首付金额）/4
                    const remainingAmount = totalRentValue - downPaymentValue;
                    const middlePeriodAmount = remainingAmount / 4;
                    
                    // 第一期 = 首付金额 * 17/30
                    const firstPeriodAmount = downPaymentValue * (17/30);
                    
                    // 第六期 = 首付金额 * 13/30
                    const sixthPeriodAmount = downPaymentValue * (13/30);
                    
                    this.billDetails = [
                        this.formatCurrency(firstPeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(sixthPeriodAmount)
                    ];
                }
                // 方案3: 首付35%|费率15%|6期
                else if (this.pickerIndex === 2) {
                    // 第二期到第五期都等于 （总租金-首付金额）/4
                    const remainingAmount = totalRentValue - downPaymentValue;
                    const middlePeriodAmount = remainingAmount / 4;
                    
                    // 第一期 = 首付金额 * 3/7
                    const firstPeriodAmount = downPaymentValue * (3/7);
                    
                    // 第六期 = 首付金额 * 4/7
                    const sixthPeriodAmount = downPaymentValue * (4/7);
                    
                    this.billDetails = [
                        this.formatCurrency(firstPeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(sixthPeriodAmount)
                    ];
                }
                // 方案4: 首付40%|费率14%|6期
                else if (this.pickerIndex === 3) {
                    // 第二期到第五期都等于 （总租金-首付金额）/4
                    const remainingAmount = totalRentValue - downPaymentValue;
                    const middlePeriodAmount = remainingAmount / 4;
                    
                    // 第一期 = 首付金额 * 7/20
                    const firstPeriodAmount = downPaymentValue * (7/20);
                    
                    // 第六期 = 首付金额 * 13/20
                    const sixthPeriodAmount = downPaymentValue * (13/20);
                    
                    this.billDetails = [
                        this.formatCurrency(firstPeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(sixthPeriodAmount)
                    ];
                }
                // 方案5: 首付50%|费率10%|6期
                else if (this.pickerIndex === 4) {
                    // 第二期到第四期都等于 （总租金-首付金额）/3
                    const remainingAmount = totalRentValue - downPaymentValue;
                    const middlePeriodAmount = remainingAmount / 3;
                    
                    // 第一期 = 首付金额 * 1/5
                    const firstPeriodAmount = downPaymentValue * (1/5);
                    
                    // 第五期和第六期都等于 首付金额 * 2/5
                    const lastTwoPeriodAmount = downPaymentValue * (2/5);
                    
                    this.billDetails = [
                        this.formatCurrency(firstPeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(middlePeriodAmount),
                        this.formatCurrency(lastTwoPeriodAmount),
                        this.formatCurrency(lastTwoPeriodAmount)
                    ];
                }
                
            } else if (forceUpdate) {
                // 仅当强制更新且未选择方案时清空数据
                this.feeRate = '--';
                this.totalRent = '--';
                this.downPayment = '--';
                this.billDetails = [];
            }
            // 如果不强制更新且未选择方案，保留原有数据
        }
    }
}
</script>

<style>
/* 简单的样式，让界面看起来整洁 */
.container {
    padding: 30rpx;
    padding-bottom: 140rpx; /* 为底部固定按钮留出空间 */
    min-height: 100vh;
    box-sizing: border-box;
    position: relative;
}

/* 大输入框组的样式 */
.input-group {
    border: 2rpx solid #ddd;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 30rpx;
    background-color: #fafafa;
}

/* 每一行的样式，使用flex布局让标签和输入框在同一行 */
.input-row {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
}

.input-row:last-child {
    margin-bottom: 0;
}

/* 标签样式，固定宽度，右对齐 */
.label {
    width: 120rpx;
    font-size: 30rpx;
    color: #333;
    text-align: right;
    margin-right: 20rpx;
}

/* 售价输入框包装器 */
.price-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    height: 80rpx;
}

/* 货币符号样式 */
.currency-symbol {
    position: absolute;
    left: 20rpx;
    color: #333;
    font-size: 28rpx;
    z-index: 1;
}

/* 售价输入框样式 - 增加左内边距为货币符号留出空间 */
.price-input {
    flex: 1;
    height: 80rpx;
    border: 2rpx solid #ddd;
    border-radius: 10rpx;
    padding-left: 60rpx !important; /* 为¥符号留出空间 */
    padding-right: 20rpx;
    font-size: 28rpx;
    background-color: #fff;
    width: 100%;
}

/* 下拉框容器样式，占据剩余宽度 */
.picker-wrapper {
    flex: 1;
}

/* 下拉框样式 */
.picker-box {
    height: 80rpx;
    border: 2rpx solid #ddd;
    border-radius: 10rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    line-height: 80rpx;
    color: #333;
    background-color: #fff;
}

/* 未选中时的样式 */
.picker-box.placeholder {
    color: #999;
}

/* 费用总览大框样式 */
.summary-group {
    border: 2rpx solid #ddd;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 30rpx;
    background-color: #fafafa;
}

.summary-title {
    font-weight: bold;
    font-size: 34rpx;
    color: #333;
    margin-bottom: 20rpx;
    padding-bottom: 10rpx;
    border-bottom: 2rpx solid #eee;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    font-size: 30rpx;
}

.summary-row:last-child {
    margin-bottom: 0;
}

/* 账单标签包装器 */
.bill-label-wrapper {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

/* 账单标签基础样式 */
.bill-tag {
    font-size: 20rpx;
    padding: 4rpx 8rpx;
    border-radius: 4rpx;
    color: #fff;
    font-weight: normal;
    white-space: nowrap;
}

/* 首期金额标签 - 红色背景 */
.bill-tag-first {
    background-color: #ff3b30;
}

/* 中期金额标签 - 橙色背景 */
.bill-tag-middle {
    background-color: #ff3b30;
}

/* 尾期金额标签 - 红色背景（与首期相同） */
.bill-tag-last {
    background-color: #ff3b30;
}

.summary-label {
    color: #666;
}

.summary-value {
    color: #007aff;
    font-weight: 500;
}

/* 底部固定按钮容器 */
.fixed-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20rpx 30rpx;
    background-color: #fff;
    box-shadow: 0 -4rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 100;
}

/* 按钮样式 */
.calculate-btn {
    background-color: #007aff;
    color: #fff;
    font-size: 32rpx;
    height: 90rpx;
    line-height: 90rpx;
    border-radius: 45rpx;
    width: 100%;
    margin: 0;
}
.calculate-btn:active {
    background-color: #005bbf;
}
/* 覆盖按钮默认样式 */
button[type="primary"] {
    background-color: #007aff;
}
</style>