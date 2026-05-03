// ==UserScript==
// @name         BHXH Auto-Helper (Pro: Queue + Auto-Retry Year) v2.6
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Auto-Retry với Year-Only nếu lỗi "Ngày sinh không đúng" + Queue System + Progress Counter
// @author       DevTools Assistant
// @match        *://baohiemxahoi.gov.vn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 0. STATE MANAGEMENT
    // ==========================================
    let autoZeroEnabled = localStorage.getItem('bhxh_auto_zero') !== 'false';
    let isQueueRunning = localStorage.getItem('bhxh_q_running') === 'true';
    let isPanelHidden = localStorage.getItem('bhxh_q_hidden') === 'true';
    let lastProcessedToken = "";
    let lastCopiedId = "";
    let hasRetriedWithYearOnly = false; // Track retry state

    // ==========================================
    // 1. UI: AUTO-ZERO TOGGLE
    // ==========================================
    const createZeroToggle = () => {
        const btn = document.createElement('button');
        const updateUI = () => {
            btn.innerText = "Auto 0: " + (autoZeroEnabled ? "ON" : "OFF");
            btn.style.backgroundColor = autoZeroEnabled ? "#28a745" : "#dc3545";
        };
        btn.style.cssText = `position:fixed; top:15px; left:15px; z-index:9999; padding:8px 15px; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.3);`;
        updateUI();
        btn.addEventListener('click', () => {
            autoZeroEnabled = !autoZeroEnabled;
            localStorage.setItem('bhxh_auto_zero', autoZeroEnabled);
            updateUI();
        });
        document.body.appendChild(btn);
    };

    // ==========================================
    // 1B. CAPTCHA STATUS INDICATOR
    // ==========================================
    const createCaptchaStatus = () => {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'captchaStatus';
        statusDiv.style.cssText = `
            position:fixed; top:15px; left:140px; z-index:9999; 
            padding:8px 15px; background:#6c757d; color:white; 
            border:none; border-radius:5px; font-weight:bold; 
            box-shadow:0 2px 5px rgba(0,0,0,0.3); font-size:13px;
        `;
        statusDiv.innerText = "⏳ Chờ Captcha...";
        document.body.appendChild(statusDiv);
        return statusDiv;
    };

    // ==========================================
    // 2. UI & LOGIC: QUEUE PANEL
    // ==========================================
    const createQueuePanel = () => {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed; top: 60px; right: 15px; width: 280px;
            background: white; border: 2px solid #0056b3; border-radius: 8px;
            padding: 10px; z-index: 99999; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif; font-size: 13px;
        `;

        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <div style="font-weight:bold; color:#0056b3; font-size:15px;">🚀 QUEUE SYSTEM</div>
                <button id="qToggleHide" title="Ẩn/Hiện Queue" style="background:none; border:none; cursor:pointer; font-weight:bold; color:#555; font-size:14px; padding:0;">${isPanelHidden ? '[+]' : '[—]'}</button>
            </div>
            
            <div id="qContent" style="display: ${isPanelHidden ? 'none' : 'block'}">
                <!-- PROGRESS COUNTER -->
                <div id="qProgress" style="background:#e9ecef; padding:6px; border-radius:4px; margin-bottom:8px; text-align:center; font-weight:bold; color:#495057; display:none;">
                    Đã tra: <span id="qDone">0</span> / <span id="qTotal">0</span>
                </div>

                <textarea id="qInput" placeholder="Dán danh sách từ Excel vào đây\n(Tên - ID - Ngày sinh)" style="width:100%; height:80px; margin-bottom:5px; box-sizing:border-box; font-size:12px;"></textarea>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <button id="qStart" style="flex:1; background:${isQueueRunning ? '#ffc107' : '#007bff'}; color:${isQueueRunning ? 'black' : 'white'}; border:none; padding:5px; cursor:pointer; font-weight:bold; margin-right:5px; border-radius:3px;">
                        ${isQueueRunning ? '⏸ Đang chạy...' : '▶ Bắt đầu'}
                    </button>
                    <button id="qSkip" title="Bỏ qua dòng hiện tại nếu bị lỗi" style="background:#6c757d; color:white; border:none; padding:5px; cursor:pointer; font-weight:bold; border-radius:3px;">⏭ Bỏ qua</button>
                </div>
                <div style="font-weight:bold; margin-bottom:5px;">Kết quả thu được:</div>
                <textarea id="qResult" readonly style="width:100%; height:80px; margin-bottom:5px; box-sizing:border-box; background:#f8f9fa; font-size:12px;"></textarea>
                <div style="display:flex; justify-content:space-between;">
                    <button id="qCopy" style="flex:1; background:#28a745; color:white; border:none; padding:5px; cursor:pointer; font-weight:bold; margin-right:5px; border-radius:3px;">📋 Copy</button>
                    <button id="qClear" style="background:#dc3545; color:white; border:none; padding:5px; cursor:pointer; font-weight:bold; border-radius:3px;">🗑 Xóa hết</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('qToggleHide').addEventListener('click', (e) => {
            isPanelHidden = !isPanelHidden;
            localStorage.setItem('bhxh_q_hidden', isPanelHidden);
            document.getElementById('qContent').style.display = isPanelHidden ? 'none' : 'block';
            e.target.innerText = isPanelHidden ? '[+]' : '[—]';
        });

        const qInput = document.getElementById('qInput');
        const qResult = document.getElementById('qResult');
        const btnStart = document.getElementById('qStart');
        const btnSkip = document.getElementById('qSkip');

        qInput.value = localStorage.getItem('bhxh_q_list') || "";
        qResult.value = localStorage.getItem('bhxh_q_results') || "";

        qInput.addEventListener('input', () => {
            localStorage.setItem('bhxh_q_list', qInput.value);
            updateProgress();
        });

        btnStart.addEventListener('click', () => {
            if (!qInput.value.trim()) return alert("⚠️ Vui lòng dán danh sách vào ô trước!");
            isQueueRunning = !isQueueRunning;
            localStorage.setItem('bhxh_q_running', isQueueRunning);
            if (isQueueRunning) {
                updateProgress();
                window.location.reload(); 
            } else { 
                btnStart.innerHTML = "▶ Bắt đầu"; 
                btnStart.style.background = "#007bff"; 
                btnStart.style.color = "white"; 
            }
        });

        document.getElementById('qCopy').addEventListener('click', () => {
            navigator.clipboard.writeText(qResult.value).then(() => alert("✅ Đã copy toàn bộ kết quả!"));
        });

        document.getElementById('qClear').addEventListener('click', () => {
            if(confirm("⚠️ Bạn có chắc muốn xóa sạch danh sách và kết quả không?")) {
                localStorage.removeItem('bhxh_q_list');
                localStorage.removeItem('bhxh_q_results');
                localStorage.setItem('bhxh_q_running', 'false');
                qInput.value = ""; qResult.value = "";
                isQueueRunning = false;
                btnStart.innerHTML = "▶ Bắt đầu"; 
                btnStart.style.background = "#007bff"; 
                btnStart.style.color = "white";
                updateProgress();
            }
        });

        btnSkip.addEventListener('click', () => {
            advanceQueue("⏭ Bỏ qua");
        });

        updateProgress();
    };

    // ==========================================
    // 2B. UPDATE PROGRESS COUNTER
    // ==========================================
    const updateProgress = () => {
        const qInput = document.getElementById('qInput');
        const qResult = document.getElementById('qResult');
        const progressDiv = document.getElementById('qProgress');
        
        if (!qInput || !progressDiv) return;

        const remaining = qInput.value.trim().split('\n').filter(l => l.trim() !== '').length;
        const completed = qResult.value.trim().split('\n').filter(l => l.trim() !== '').length;
        const total = remaining + completed;

        if (total > 0) {
            progressDiv.style.display = 'block';
            document.getElementById('qDone').innerText = completed;
            document.getElementById('qTotal').innerText = total;
        } else {
            progressDiv.style.display = 'none';
        }
    };

    const processQueueAutoFill = () => {
        if (!isQueueRunning) return;
        let queueList = document.getElementById('qInput').value.trim().split('\n').filter(l => l.trim() !== '');
        
        if (queueList.length > 0) {
            const parts = queueList[0].split(/\t| {2,}/);
            if (parts.length >= 3) {
                setTimeout(() => {
                    fillForm(parts[0], parts[1], parts[2]);
                    console.log("✅ Queue: Auto-filled -> " + parts[0]);
                    updateProgress();
                }, 500); 
            } else {
                advanceQueue("❌ Lỗi định dạng"); 
            }
        } else {
            localStorage.setItem('bhxh_q_running', 'false');
            document.getElementById('qStart').innerHTML = "▶ Bắt đầu";
            document.getElementById('qStart').style.background = "#007bff";
            alert("🎉 ĐÃ TRA CỨU XONG TOÀN BỘ DANH SÁCH!");
            updateProgress();
        }
    };

    const advanceQueue = (resultValue) => {
        let queueList = document.getElementById('qInput').value.trim().split('\n').filter(l => l.trim() !== '');
        let currentResults = document.getElementById('qResult').value;
        
        if (queueList.length > 0) {
            const parts = queueList[0].split(/\t| {2,}/);
            const currentName = parts[0] || "Không xác định";
            
            // Format: Tên - Kết quả
            let resultString = `${currentName} - ${resultValue}`;
            
            currentResults += (currentResults ? "\n" : "") + resultString;
            document.getElementById('qResult').value = currentResults;
            localStorage.setItem('bhxh_q_results', currentResults);

            queueList.shift();
            const newQueueString = queueList.join('\n');
            document.getElementById('qInput').value = newQueueString;
            localStorage.setItem('bhxh_q_list', newQueueString);

            updateProgress();

            if (queueList.length > 0) {
                setTimeout(() => window.location.reload(), 1500); 
            } else {
                localStorage.setItem('bhxh_q_running', 'false');
                alert("🎉 ĐÃ TRA CỨU XONG TOÀN BỘ DANH SÁCH!");
            }
        }
    };

    // ==========================================
    // 3. CORE LOGIC (Auto-Fill & Format)
    // ==========================================
    const fillForm = (name, id, dob) => {
        const hoTenInput = document.querySelector('input#txtHoTen');
        const maTheInput = document.querySelector('input#txtMaThe');
        const ngaySinhInput = document.querySelector('input#txtNgaySinh');

        if (hoTenInput) hoTenInput.value = name.trim();
        
        if (maTheInput) {
            let cleanId = id.trim();
            maTheInput.value = (autoZeroEnabled && !cleanId.startsWith('0')) ? '0' + cleanId : cleanId;
        }
        
        if (ngaySinhInput) {
            let formattedDob = dob.trim();
            const match = formattedDob.match(/^(\d{2}\/\d{2}\/)(\d{2})$/);
            if (match) {
                const century = (parseInt(match[2], 10) <= 26) ? "20" : "19";
                formattedDob = match[1] + century + match[2];
            }
            ngaySinhInput.value = formattedDob;
        }

        [hoTenInput, maTheInput, ngaySinhInput].forEach(el => {
            if (el) {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
        });
    };

    const applyFormatting = () => {
        const maTheInput = document.querySelector('input#txtMaThe');
        const ngaySinhInput = document.querySelector('input#txtNgaySinh');
        const hoTenInput = document.querySelector('input#txtHoTen');

        [maTheInput, ngaySinhInput, hoTenInput].forEach(input => {
            if (input && !input.dataset.pasteHooked) {
                input.dataset.pasteHooked = "true";
                input.addEventListener('paste', (e) => {
                    if (isQueueRunning) return; 
                    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
                    const parts = pasteData.split(/\t| {2,}/);
                    if (parts.length >= 3) {
                        e.preventDefault();
                        fillForm(parts[0], parts[1], parts[2]);
                    }
                });
            }
        });

        if (ngaySinhInput && !ngaySinhInput.dataset.hooked) {
            ngaySinhInput.dataset.hooked = "true";
            ngaySinhInput.addEventListener('blur', (e) => {
                let val = e.target.value.trim();
                const match = val.match(/^(\d{2}\/\d{2}\/)(\d{2})$/);
                if (match) {
                    const century = (parseInt(match[2], 10) <= 26) ? "20" : "19";
                    e.target.value = match[1] + century + match[2];
                    e.target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }
    };

    // ==========================================
    // 4. AUTO CLICK & EXTRACT
    // ==========================================
    const findSubmitButton = () => {
        let btn = document.getElementById('btnTraCuu') 
               || document.getElementById('btnTracuu')
               || document.getElementById('btnTracứu')
               || document.querySelector('button[type="submit"]')
               || document.querySelector('input[type="submit"]')
               || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tra cứu') || b.innerText.includes('tra cứu'));
        return btn;
    };

    const checkCaptchaAndClick = () => {
        const responseField = document.querySelector('[name="g-recaptcha-response"]');
        const statusDiv = document.getElementById('captchaStatus');
        
        if (responseField && responseField.value.length > 0) {
            if (statusDiv) {
                statusDiv.style.background = "#28a745";
                statusDiv.innerText = "✅ Captcha OK";
            }
            
            if (lastProcessedToken !== responseField.value) {
                lastProcessedToken = responseField.value;
                const btn = findSubmitButton();
                
                if (btn) {
                    console.log("🚀 Auto-clicking submit button...");
                    btn.click();
                    
                    if (statusDiv) {
                        statusDiv.innerText = "⏳ Đang tra cứu...";
                        statusDiv.style.background = "#ffc107";
                    }
                } else {
                    console.warn("⚠️ Không tìm thấy nút Tra cứu!");
                }
            }
        } else {
            if (statusDiv) {
                statusDiv.style.background = "#6c757d";
                statusDiv.innerText = "⏳ Chờ Captcha...";
            }
        }
    };

    // ==========================================
    // 4B. AUTO-RETRY WITH YEAR-ONLY (MỚI)
    // ==========================================
    const extractYearFromDOB = (dobString) => {
        // Extract year from formats like: 15/06/1990, 1990, 06/1990, etc.
        const yearMatch = dobString.match(/(\d{4})$/);
        return yearMatch ? yearMatch[1] : null;
    };

    const retryWithYearOnly = () => {
        const ngaySinhInput = document.querySelector('input#txtNgaySinh');
        if (!ngaySinhInput) return false;

        const currentDOB = ngaySinhInput.value.trim();
        const yearOnly = extractYearFromDOB(currentDOB);

        if (yearOnly && currentDOB !== yearOnly) {
            console.log(`🔄 Retry với Year-Only: ${currentDOB} → ${yearOnly}`);
            
            ngaySinhInput.value = yearOnly;
            ngaySinhInput.dispatchEvent(new Event('input', { bubbles: true }));
            ngaySinhInput.dispatchEvent(new Event('blur', { bubbles: true }));

            const statusDiv = document.getElementById('captchaStatus');
            if (statusDiv) {
                statusDiv.style.background = "#ff9800";
                statusDiv.innerText = "🔄 Thử lại: Year-Only";
            }

            // Wait cho input update rồi click submit
            setTimeout(() => {
                lastProcessedToken = ""; // Reset để trigger click lại
                const btn = findSubmitButton();
                if (btn) btn.click();
            }, 500);

            return true;
        }
        return false;
    };

    const extractAndCopyID = () => {
        const bodyText = document.body.innerText;
        
        // ==========================================
        // CHECK FOR DOB ERROR (MỚI)
        // ==========================================
        if (bodyText.includes("Ngày sinh không đúng") || bodyText.includes("Ngày sinh chưa chính xác")) {
            console.log("⚠️ Phát hiện lỗi Ngày sinh không đúng!");
            
            if (!hasRetriedWithYearOnly) {
                hasRetriedWithYearOnly = true;
                const retried = retryWithYearOnly();
                
                if (retried) {
                    console.log("✅ Đã retry với Year-Only");
                    return; // Chờ kết quả retry
                }
            } else {
                // Đã retry rồi mà vẫn lỗi -> Skip
                console.log("❌ Đã retry Year-Only nhưng vẫn lỗi -> Skip");
                hasRetriedWithYearOnly = false; // Reset cho lần sau
                
                if (isQueueRunning) {
                    advanceQueue("❌ Lỗi Ngày sinh");
                }
                return;
            }
        }

        // ==========================================
        // EXTRACT MÃ THẺ (LOGIC CŨ)
        // ==========================================
        const match = bodyText.match(/Mã thẻ:\s*([A-Z0-9]{13,15})/i);

        if (match && match[1]) {
            const fullId = match[1].trim().toUpperCase();
            const last10 = fullId.slice(-10);
            
            // Lấy tên người từ form
            const hoTenInput = document.querySelector('input#txtHoTen');
            const personName = hoTenInput ? hoTenInput.value.trim() : "Không xác định";
            
            let cardResult = "";

            if (fullId.startsWith('DN')) {
                cardResult = fullId + " - " + last10;
            } else {
                cardResult = last10.startsWith('0') ? "'" + last10 : last10;
            }

            // Format: Tên - Mã thẻ
            const resultString = `${personName} - ${cardResult}`;

            if (lastCopiedId !== fullId) {
                lastCopiedId = fullId;
                hasRetriedWithYearOnly = false; // Reset retry flag khi thành công
                
                const statusDiv = document.getElementById('captchaStatus');
                if (statusDiv) {
                    statusDiv.style.background = "#17a2b8";
                    statusDiv.innerText = "✅ Đã lấy mã!";
                }
                
                if (isQueueRunning) {
                    advanceQueue(cardResult);
                } else {
                    navigator.clipboard.writeText(resultString).then(() => {
                        const notify = document.createElement('div');
                        notify.innerText = "📋 COPIED: " + resultString;
                        notify.style = "position:fixed; top:60px; right:310px; background:#28a745; color:white; padding:10px; z-index:9999; border-radius:5px; font-family: sans-serif; font-weight:bold;";
                        document.body.appendChild(notify);
                        setTimeout(() => notify.remove(), 2000);
                    });
                }
            }
        } 
        else if (bodyText.includes("Không tìm thấy dữ liệu") || bodyText.includes("chưa chính xác")) {
            if (isQueueRunning) {
                const errorModal = document.querySelector('.bootbox-body, .alert-danger');
                if (errorModal && !errorModal.dataset.processed) {
                    errorModal.dataset.processed = "true";
                    hasRetriedWithYearOnly = false; // Reset
                    advanceQueue("❌ Not found"); 
                }
            }
        }
    };

    // ==========================================
    // INIT
    // ==========================================
    createZeroToggle();
    createCaptchaStatus();
    createQueuePanel();
    processQueueAutoFill();

    setInterval(() => {
        applyFormatting();
        checkCaptchaAndClick();
        extractAndCopyID();
    }, 800);

})();
