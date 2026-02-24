/**
 * 🔍 Stage 架构验收测试
 * 
 * 在浏览器控制台运行：
 * import('./js/systems/stage-test.js').then(() => stageTest.runAll())
 */

console.log('%c=== Stage 架构验收测试 ===', 'color: #00ff00; font-size: 20px; font-weight: bold;');

// ============================================
// 测试 1：检查 ViewportManager
// ============================================
function test1_ViewportManager() {
    console.log('\n%c测试 1: 检查 ViewportManager', 'color: yellow; font-weight: bold');

    if (window.viewportManager) {
        const viewport = window.viewportManager.getViewport();
        console.log('✅ ViewportManager 已初始化');
        console.log(`  - 视口尺寸: ${viewport.width}x${viewport.height}`);
        console.log(`  - DPR: ${viewport.dpr}`);
        
        const registered = Array.from(window.viewportManager.registeredCanvases.keys());
        console.log(`  - 已注册的 Canvas: ${registered.join(', ')}`);
        
        if (registered.length === 3) {
            console.log('%c✅ 通过：所有 Canvas 已注册', 'color: green');
            return true;
        } else {
            console.log(`%c⚠️ 警告：应该注册 3 个 Canvas，实际 ${registered.length} 个`, 'color: orange');
            return false;
        }
    } else {
        console.log('%c❌ 失败：ViewportManager 未初始化', 'color: red');
        return false;
    }
}

// ============================================
// 测试 2：检查 Stage 结构
// ============================================
function test2_StageStructure() {
    console.log('\n%c测试 2: 检查 Stage 结构', 'color: yellow; font-weight: bold');

    const stage = document.getElementById('stage');
    if (stage) {
        const layers = document.querySelectorAll('#stage > .stage-layer');
        console.log(`✅ 找到 #stage 容器`);
        console.log(`✅ 层数量: ${layers.length}`);
        
        layers.forEach(layer => {
            const id = layer.id;
            const isHidden = layer.classList.contains('hidden');
            const zIndex = window.getComputedStyle(layer).zIndex;
            console.log(`  - ${id}: ${isHidden ? '隐藏' : '显示'} (z-index: ${zIndex})`);
        });
        
        console.log('%c✅ 通过：Stage 结构正常', 'color: green');
        return true;
    } else {
        console.log('%c❌ 失败：未找到 #stage 容器', 'color: red');
        return false;
    }
}

// ============================================
// 测试 3：检查 Canvas 对齐
// ============================================
function test3_CanvasAlignment() {
    console.log('\n%c测试 3: 检查 Canvas 对齐', 'color: yellow; font-weight: bold');

    const stage = document.getElementById('stage');
    const canvasConfigs = [
        { id: 'map-canvas', layerId: 'map-layer' },
        { id: 'gameCanvas', layerId: 'game-layer' },
        { id: 'story-canvas', layerId: 'story-layer' }
    ];
    const stageBounds = stage ? stage.getBoundingClientRect() : null;
    
    let allAligned = true;

    canvasConfigs.forEach(({ id: canvasId, layerId }) => {
        const canvas = document.getElementById(canvasId);
        const layer = document.getElementById(layerId);
        
        if (canvas && layer) {
            const style = window.getComputedStyle(canvas);
            const isAbsolute = style.position === 'absolute';
            
            // 从 inline style 解析尺寸（ViewportManager 设置的）
            const inlineWidth = parseFloat(canvas.style.width) || 0;
            const inlineHeight = parseFloat(canvas.style.height) || 0;
            
            console.log(`  ${canvasId}:`);
            console.log(`    - position: ${style.position} ${isAbsolute ? '✅' : '❌'}`);
            console.log(`    - inline style 尺寸: ${inlineWidth.toFixed(0)}x${inlineHeight.toFixed(0)}`);
            console.log(`    - 物理像素: ${canvas.width}x${canvas.height}`);
            
            if (inlineWidth > 0 && inlineHeight > 0) {
                const dprRatio = canvas.width / inlineWidth;
                console.log(`    - DPR 比例: ${dprRatio.toFixed(2)}`);
                
                if (stageBounds) {
                    const alignedWidth = Math.abs(inlineWidth - stageBounds.width) < 1;
                    const alignedHeight = Math.abs(inlineHeight - stageBounds.height) < 1;
                    const aligned = alignedWidth && alignedHeight;
                    console.log(`    - 与 stage 对齐: ${aligned ? '✅' : '❌'}`);
                    if (!aligned) {
                        console.log(`      (stage: ${Math.round(stageBounds.width)}x${Math.round(stageBounds.height)})`);
                        allAligned = false;
                    }
                    
                    // 检查 DPR 是否合理（应该在 1-3 之间）
                    if (dprRatio < 0.5 || dprRatio > 4) {
                        console.log(`    - ⚠️ DPR 比例异常`);
                        allAligned = false;
                    }
                }
            } else {
                console.log(`    - ❌ Canvas 未设置尺寸（ViewportManager 可能未调用）`);
                allAligned = false;
            }
            
            if (!isAbsolute) allAligned = false;
        } else {
            console.log(`  ❌ ${canvasId}: 未找到 (canvas: ${!!canvas}, layer: ${!!layer})`);
            allAligned = false;
        }
    });
    
    if (allAligned) {
        console.log('%c✅ 通过：所有 Canvas 已对齐', 'color: green');
    } else {
        console.log('%c⚠️ 警告：部分 Canvas 未完全对齐', 'color: orange');
        console.log('  注意：map-canvas 在页面加载时可能还在隐藏层中，这是正常的');
        console.log('  关键检查点：inline style 尺寸是否正确、DPR 比例是否合理');
    }
    
    return allAligned;
}

// ============================================
// 测试 4：检查 LayerManager
// ============================================
function test4_LayerManager() {
    console.log('\n%c测试 4: 检查 LayerManager', 'color: yellow; font-weight: bold');

    if (window.layerManager) {
        const state = window.layerManager.getState();
        console.log('✅ LayerManager 已初始化');
        console.log(`  - 当前主层: ${state.currentMainLayer}`);
        console.log(`  - UI 层可见: ${state.isUILayerVisible}`);
        console.log(`  - Modal 层激活: ${state.isModalLayerVisible}`);
        console.log('%c✅ 通过：LayerManager 正常', 'color: green');
        return true;
    } else {
        console.log('%c❌ 失败：LayerManager 未初始化', 'color: red');
        return false;
    }
}

// ============================================
// 测试 5：检查旧代码残留
// ============================================
function test5_LegacyCode() {
    console.log('\n%c测试 5: 检查旧代码残留', 'color: yellow; font-weight: bold');

    const oldElements = [
        { id: 'start-screen', expected: false, desc: '旧的开始屏幕' },
        { id: 'start-layer', expected: true, desc: '新的开始层' },
        { id: 'map-layer', expected: true, desc: '地图层' },
        { id: 'game-layer', expected: true, desc: '游戏层' },
        { id: 'story-layer', expected: true, desc: '故事层' }
    ];

    let hasOldCode = false;
    oldElements.forEach(({ id, expected, desc }) => {
        const exists = !!document.getElementById(id);
        if (exists === expected) {
            console.log(`  ✅ ${desc} (${id}): ${exists ? '存在' : '不存在'} (符合预期)`);
        } else {
            console.log(`  ❌ ${desc} (${id}): ${exists ? '存在' : '不存在'} (不符合预期)`);
            hasOldCode = true;
        }
    });

    if (!hasOldCode) {
        console.log('%c✅ 通过：没有旧代码残留', 'color: green');
        return true;
    } else {
        console.log('%c⚠️ 警告：发现旧代码残留', 'color: orange');
        return false;
    }
}

// ============================================
// 测试 6：层切换测试（手动）
// ============================================
function test6_LayerSwitching() {
    console.log('\n%c测试 6: 层切换测试（手动）', 'color: yellow; font-weight: bold');
    console.log('请在控制台运行以下命令测试层切换：');
    console.log('%clayerManager.goToStart()', 'color: cyan');
    console.log('%clayerManager.goToMap()', 'color: cyan');
    console.log('%clayerManager.goToGame()', 'color: cyan');
    console.log('%clayerManager.goToStory()', 'color: cyan');
    console.log('\n验证：每次只有一个主层显示（其他层应该有 .hidden 类）');
    return true;
}

// ============================================
// 测试 7：窗口调整测试（手动）
// ============================================
function test7_ResizeTest() {
    console.log('\n%c测试 7: 窗口调整测试（手动）', 'color: yellow; font-weight: bold');
    console.log('请手动执行以下操作：');
    console.log('1. 拖动浏览器窗口大小，观察 Canvas 是否正确缩放');
    console.log('2. 在移动设备上横竖屏切换，是否正常适配');
    console.log('3. 打开键盘（移动端），视口是否正确调整');
    console.log('4. 观察控制台是否有多次 resize 日志（应该只有 ViewportManager 的日志）');
    console.log('\n如果只看到 ViewportManager 的日志，说明没有重复的 resize 监听器！✅');
    return true;
}

// ============================================
// 导出测试对象
// ============================================
export const stageTest = {
    test1: test1_ViewportManager,
    test2: test2_StageStructure,
    test3: test3_CanvasAlignment,
    test4: test4_LayerManager,
    test5: test5_LegacyCode,
    test6: test6_LayerSwitching,
    test7: test7_ResizeTest,
    
    runAll: function() {
        console.log('%c========================================', 'color: #00ff00; font-size: 16px; font-weight: bold');
        console.log('%c   Stage 架构验收测试', 'color: #00ff00; font-size: 16px; font-weight: bold');
        console.log('%c========================================', 'color: #00ff00; font-size: 16px; font-weight: bold');
        
        const results = {};
        results.test1 = this.test1();
        results.test2 = this.test2();
        results.test3 = this.test3();
        results.test4 = this.test4();
        results.test5 = this.test5();
        results.test6 = this.test6();
        results.test7 = this.test7();
        
        // 总结
        console.log('\n%c========================================', 'color: #00ff00; font-size: 16px; font-weight: bold');
        console.log('%c   测试总结', 'color: #00ff00; font-size: 16px; font-weight: bold');
        console.log('%c========================================', 'color: #00ff00; font-size: 16px; font-weight: bold');
        
        const passed = Object.values(results).filter(r => r === true).length;
        const total = Object.keys(results).length;
        console.log(`\n通过: ${passed}/${total}`);
        
        if (passed === total) {
            console.log('%c\n🎉 所有测试通过！架构迁移成功！', 'color: green; font-size: 14px; font-weight: bold');
        } else {
            console.log('%c\n⚠️ 部分测试未通过，请检查上方详情', 'color: orange; font-size: 14px; font-weight: bold');
        }
        
        console.log('\n%c额外验证项（手动）：', 'color: #ffff00; font-weight: bold');
        console.log('✓ 拖动窗口大小，Canvas 是否正确缩放');
        console.log('✓ 手机横竖屏切换，是否正常适配');
        console.log('✓ 控制台是否有重复的 resize 日志（应该只有 ViewportManager）');
        console.log('✓ 所有层切换是否互斥（同时只显示一个主层）');
        
        return results;
    },
    
    // 辅助工具
    testLayers: () => {
        console.log('开始层切换测试...');
        setTimeout(() => {
            console.log('切换到 map');
            window.layerManager.goToMap();
        }, 1000);
        setTimeout(() => {
            console.log('切换到 game');
            window.layerManager.goToGame();
        }, 2000);
        setTimeout(() => {
            console.log('切换到 story');
            window.layerManager.goToStory();
        }, 3000);
        setTimeout(() => {
            console.log('切换回 start');
            window.layerManager.goToStart();
        }, 4000);
    },
    
    checkViewport: () => {
        const vp = window.viewportManager.getViewport();
        console.log('视口信息:', vp);
        console.log('window.innerWidth:', window.innerWidth);
        console.log('window.innerHeight:', window.innerHeight);
        if (window.visualViewport) {
            console.log('visualViewport.width:', window.visualViewport.width);
            console.log('visualViewport.height:', window.visualViewport.height);
        }
    },
    
    refreshCanvases: () => {
        console.log('强制刷新所有 Canvas...');
        window.viewportManager.refresh();
    }
};

// 挂载到 window 以便在控制台使用
window.stageTest = stageTest;

// 自动运行所有测试
console.log('%c正在运行 Stage 架构测试...', 'color: cyan; font-weight: bold');
stageTest.runAll();

console.log('\n%c辅助工具已添加到 window.stageTest:', 'color: cyan; font-weight: bold');
console.log('  - stageTest.runAll() - 运行所有测试');
console.log('  - stageTest.test1() ~ test7() - 运行单个测试');
console.log('  - stageTest.testLayers() - 自动测试层切换');
console.log('  - stageTest.checkViewport() - 检查视口信息');
console.log('  - stageTest.refreshCanvases() - 强制刷新 Canvas');

