/* ============================
   Contact Simulator – app.js
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  // ========== 1) トグル開閉 ==========
  const toggleBlocks = document.querySelectorAll('.toggle-block');

  toggleBlocks.forEach(block => {
    const header = block.querySelector('.toggle-block__header');
    const body = block.querySelector('.toggle-block__body');
    const arrow = block.querySelector('.toggle-block__arrow');

    // デフォルトは閉じている
    body.style.display = 'none';
    header.setAttribute('aria-expanded', 'false');

    header.addEventListener('click', () => {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      header.setAttribute('aria-expanded', String(!isOpen));
      arrow.classList.toggle('toggle-block__arrow--open', !isOpen);
    });
  });

  // ========== 2) プラン選択（radio挙動はHTML側で完了、金額再計算のみ） ==========
  const logoRadios = document.querySelectorAll('input[name="logo_plan"]');
  const hpRadios = document.querySelectorAll('input[name="hp_plan"]');

  logoRadios.forEach(r => r.addEventListener('change', () => {
    updateTotal();
    checkMeishiWarning();
  }));
  hpRadios.forEach(r => r.addEventListener('change', updateTotal));

  // ========== 3) 追加オプション（＋－） ==========
  document.querySelectorAll('.option-row').forEach(row => {
    const minusBtn = row.querySelector('.option-btn--minus');
    const plusBtn = row.querySelector('.option-btn--plus');
    const countEl = row.querySelector('.option-row__count');

    minusBtn.addEventListener('click', () => {
      let count = parseInt(countEl.textContent, 10);
      if (count > 0) {
        count--;
        countEl.textContent = count;
        updateTotal();
        checkMeishiWarning();
      }
    });

    plusBtn.addEventListener('click', () => {
      let count = parseInt(countEl.textContent, 10);
      count++;
      countEl.textContent = count;
      updateTotal();
      checkMeishiWarning();
    });
  });

  // ========== 4) 合計金額バー ==========
  const TAX_RATE = 1.1;
  const totalTaxExcEl = document.getElementById('total-tax-exc');
  const totalTaxIncEl = document.getElementById('total-tax-inc');

  function getSelectedPlanPrice(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? parseInt(checked.dataset.price, 10) : 0;
  }

  function getOptionsTotal(containerId) {
    let total = 0;
    const container = document.getElementById(containerId);
    if (!container) return 0;
    container.querySelectorAll('.option-row').forEach(row => {
      const price = parseInt(row.dataset.price, 10);
      const count = parseInt(row.querySelector('.option-row__count').textContent, 10);
      total += price * count;
    });
    return total;
  }

  function formatYen(amount) {
    return '¥' + amount.toLocaleString('ja-JP');
  }

  function updateTotal() {
    const logoPrice = getSelectedPlanPrice('logo_plan');
    const hpPrice = getSelectedPlanPrice('hp_plan');
    const logoOptions = getOptionsTotal('logo-options');
    const hpOptions = getOptionsTotal('hp-options');

    const subtotal = logoPrice + hpPrice + logoOptions + hpOptions;
    const taxIncluded = Math.floor(subtotal * TAX_RATE);

    totalTaxExcEl.textContent = formatYen(subtotal) + '（税抜）';
    totalTaxIncEl.textContent = formatYen(taxIncluded) + '（税込）';
  }

  // 初期計算
  updateTotal();

  // ========== 5) 確認画面フロー ==========
  const inputScreen = document.getElementById('input-screen');
  const confirmScreen = document.getElementById('confirm-screen');
  const confirmBtn = document.getElementById('confirm-btn');
  const backBtn = document.getElementById('back-btn');
  const totalBar = document.getElementById('total-bar');

  // バリデーション
  function validateForm() {
    const errorClass = {
      input: 'form-input--error',
      select: 'form-select--error',
      textarea: 'form-textarea--error'
    };

    // 既存エラー表示を全てクリア
    document.querySelectorAll('.form-input--error, .form-select--error, .form-textarea--error')
      .forEach(el => el.classList.remove(errorClass.input, errorClass.select, errorClass.textarea));
    document.querySelectorAll('.form-error-msg').forEach(el => el.remove());
    const oldAlert = document.querySelector('.validation-alert');
    if (oldAlert) oldAlert.remove();

    const rules = [
      { id: 'fullname', type: 'input', label: 'お名前' },
      { id: 'furigana', type: 'input', label: 'フリガナ' },
      { id: 'email', type: 'input', label: 'メールアドレス' },
      { id: 'deadline', type: 'input', label: '希望納期' },
      { id: 'meeting-style', type: 'select', label: '打ち合わせの形式' },
      { id: 'referral', type: 'select', label: '当方を知ったきっかけ' },
      { id: 'message', type: 'textarea', label: 'お問い合わせ内容' }
    ];

    const errors = [];

    rules.forEach(rule => {
      const el = document.getElementById(rule.id);
      if (!el) return;
      let empty = false;
      if (rule.type === 'select') {
        empty = !el.value || el.value === '';
      } else {
        empty = el.value.trim() === '';
      }
      if (empty) {
        const cls = errorClass[rule.type] || errorClass.input;
        el.classList.add(cls);
        errors.push({ el, label: rule.label });
      }
    });

    if (errors.length > 0) {
      // アラートメッセージ
      const alert = document.createElement('p');
      alert.className = 'validation-alert';
      alert.textContent = '必須項目を入力してください';
      confirmBtn.parentElement.insertBefore(alert, confirmBtn);

      // 最初のエラーフィールドへスクロール
      errors[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errors[0].el.focus();
      return false;
    }
    return true;
  }

  confirmBtn.addEventListener('click', () => {
    if (!validateForm()) return;

    buildConfirmContent();
    inputScreen.style.display = 'none';
    confirmScreen.style.display = 'block';
    totalBar.style.display = 'none';
    window.scrollTo(0, 0);
  });

  backBtn.addEventListener('click', () => {
    confirmScreen.style.display = 'none';
    inputScreen.style.display = 'block';
    totalBar.style.display = 'block';
    window.scrollTo(0, 0);
  });

  function getSelectedPlanLabel(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.dataset.label : '未選択';
  }

  function getSelectedOptions(containerId) {
    const options = [];
    const container = document.getElementById(containerId);
    if (!container) return options;
    container.querySelectorAll('.option-row').forEach(row => {
      const count = parseInt(row.querySelector('.option-row__count').textContent, 10);
      if (count > 0) {
        const label = row.querySelector('.option-row__label').textContent.split('：')[0];
        options.push(`${label} × ${count}`);
      }
    });
    return options;
  }

  function getUrgencyLabel() {
    const urgencyMap = {
      consult: '相談して決めたい',
      not_urgent: '急ぎではない',
      asap: '急ぎではないが出来るだけ早め希望',
      urgent: '急ぎ'
    };
    const checked = document.querySelector('input[name="urgency"]:checked');
    return checked ? urgencyMap[checked.value] || checked.value : '未選択';
  }

  function getMeetingStyleLabel() {
    const sel = document.getElementById('meeting-style');
    return sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].textContent.replace('・', '') : '未選択';
  }

  function getReferralLabel() {
    const sel = document.getElementById('referral');
    return sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].textContent.replace('・', '') : '未選択';
  }

  function buildConfirmContent() {
    // お見積内容
    const estimateEl = document.getElementById('confirm-estimate-content');
    const logoPlan = getSelectedPlanLabel('logo_plan');
    const logoOptions = getSelectedOptions('logo-options');
    const hpPlan = getSelectedPlanLabel('hp_plan');
    const hpOptions = getSelectedOptions('hp-options');

    let estimateHTML = '';
    estimateHTML += '<div class="confirm-item">';
    estimateHTML += '<p class="confirm-item__label">・ロゴ制作</p>';
    estimateHTML += `<p class="confirm-item__value">プラン：${logoPlan}</p>`;
    estimateHTML += `<p class="confirm-item__value">オプション：${logoOptions.length > 0 ? logoOptions.join('、') : '選択無し'}</p>`;
    estimateHTML += '</div>';
    estimateHTML += '<div class="confirm-item">';
    estimateHTML += '<p class="confirm-item__label">・HP制作</p>';
    estimateHTML += `<p class="confirm-item__value">プラン：${hpPlan}</p>`;
    estimateHTML += `<p class="confirm-item__value">オプション：${hpOptions.length > 0 ? hpOptions.join('、') : '選択無し'}</p>`;
    estimateHTML += '</div>';
    estimateEl.innerHTML = estimateHTML;

    // 合計金額
    const totalArea = document.getElementById('confirm-total-area');
    const subtotal = getSelectedPlanPrice('logo_plan') + getSelectedPlanPrice('hp_plan')
      + getOptionsTotal('logo-options') + getOptionsTotal('hp-options');
    const taxIncluded = Math.floor(subtotal * TAX_RATE);

    totalArea.innerHTML = `
      <p class="confirm-item__label">・概算見積合計金額</p>
      <p class="confirm-total__amount">${formatYen(taxIncluded)}（税込）</p>
      <p class="confirm-total__note">＊正式なお見積はヒアリング後に確定いたします。</p>
    `;

    // ご相談内容
    const contactEl = document.getElementById('confirm-contact-content');
    const fullname = document.getElementById('fullname').value || '未入力';
    const furigana = document.getElementById('furigana').value || '未入力';
    const email = document.getElementById('email').value || '未入力';
    const sns = document.getElementById('sns').value || '未入力';
    const deadline = document.getElementById('deadline').value || '未選択';
    const urgency = getUrgencyLabel();
    const meetingStyle = getMeetingStyleLabel();
    const referral = getReferralLabel();
    const message = document.getElementById('message').value || '未入力';

    contactEl.innerHTML = `
      <div class="confirm-item">
        <p class="confirm-item__row">お名前：${fullname}</p>
        <p class="confirm-item__row">フリガナ：${furigana}</p>
        <p class="confirm-item__row">メールアドレス：${email}</p>
        <p class="confirm-item__row">SNS：${sns}</p>
        <p class="confirm-item__row">納品希望時期：${deadline}</p>
        <p class="confirm-item__row" style="padding-left:7em;">${urgency}</p>
        <p class="confirm-item__row">打ち合わせの形式：${meetingStyle}</p>
        <p class="confirm-item__row">当方を知ったきっかけ：${referral}</p>
        <p class="confirm-item__row">お問い合わせ内容：${message}</p>
      </div>
    `;
  }

  // ========== 6) 特殊条件（プレミアム + 名刺制作の警告表示） ==========
  const meishiOptionRow = document.querySelector('#logo-options .option-row[data-option="meishi"]');
  let warningEl = null;

  function checkMeishiWarning() {
    const logoPlan = document.querySelector('input[name="logo_plan"]:checked');
    const isPremium = logoPlan && logoPlan.value === 'premium';
    const meishiCount = parseInt(meishiOptionRow.querySelector('.option-row__count').textContent, 10);

    if (isPremium && meishiCount > 0) {
      if (!warningEl) {
        warningEl = document.createElement('p');
        warningEl.className = 'option-warning';
        warningEl.textContent = 'プレミアムプラン内に含まれています';
      }
      // 名刺印刷代行ラベルのすぐ下（カード内）に挿入
      const label = meishiOptionRow.querySelector('.option-row__label');
      if (!meishiOptionRow.querySelector('.option-warning')) {
        label.insertAdjacentElement('afterend', warningEl);
      }
    } else {
      if (warningEl && warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }
  }

  // 初期チェック
  checkMeishiWarning();

  // ========== 7) LINE送信 ==========
  const OFFICIAL_LINE_URL = 'https://lin.ee/48ytUxF';
  const lineBtn = document.getElementById('line-btn');
  const copyNotice = document.getElementById('copy-notice');

  function isMobile() {
    return /iPhone|Android/i.test(navigator.userAgent);
  }

  function getOptionsDetailText(containerId) {
    const items = [];
    const container = document.getElementById(containerId);
    if (!container) return 'なし';
    container.querySelectorAll('.option-row').forEach(row => {
      const count = parseInt(row.querySelector('.option-row__count').textContent, 10);
      if (count > 0) {
        const labelText = row.querySelector('.option-row__label').textContent;
        items.push(`  ${labelText} × ${count}`);
      }
    });
    return items.length > 0 ? '\n' + items.join('\n') : 'なし';
  }

  function buildLineText() {
    const logoPlan = getSelectedPlanLabel('logo_plan');
    const logoOpts = getOptionsDetailText('logo-options');
    const hpPlan = getSelectedPlanLabel('hp_plan');
    const hpOpts = getOptionsDetailText('hp-options');

    const subtotal = getSelectedPlanPrice('logo_plan') + getSelectedPlanPrice('hp_plan')
      + getOptionsTotal('logo-options') + getOptionsTotal('hp-options');
    const taxIncluded = Math.floor(subtotal * TAX_RATE);

    const fullname = document.getElementById('fullname').value || '未入力';
    const furigana = document.getElementById('furigana').value || '未入力';
    const email = document.getElementById('email').value || '未入力';
    const sns = document.getElementById('sns').value || '未入力';
    const deadline = document.getElementById('deadline').value || '未選択';
    const urgency = getUrgencyLabel();
    const meetingStyle = getMeetingStyleLabel();
    const referral = getReferralLabel();
    const message = document.getElementById('message').value || '未入力';

    return `【見積シミュレーター】
■お見積
ロゴ制作：
- プラン：${logoPlan}
- オプション：${logoOpts}
HP制作：
- プラン：${hpPlan}
- オプション：${hpOpts}

■概算見積合計金額（税込）
${formatYen(taxIncluded)}
※正式なお見積はヒアリング後に確定いたします。

■ご相談
お名前：${fullname}
フリガナ：${furigana}
メール：${email}
SNS：${sns}
希望納期：${deadline}（${urgency}）
打ち合わせ形式：${meetingStyle}
きっかけ：${referral}
お問い合わせ内容：${message}`;
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (e) {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        return fallbackCopy(text);
      }
    }
    return fallbackCopy(text);
  }

  function showCopyNotice(msg) {
    copyNotice.textContent = msg;
    copyNotice.style.display = 'block';
    setTimeout(() => {
      copyNotice.style.display = 'none';
    }, 6000);
  }

  lineBtn.addEventListener('click', async () => {
    const text = buildLineText();
    const ok = await copyToClipboard(text);

    if (isMobile()) {
      // モバイル → コピー後に公式LINEへ遷移
      window.location.href = OFFICIAL_LINE_URL;
    } else {
      // PC → コピー結果を表示
      if (ok) {
        showCopyNotice('コピーしました。LINEアプリで貼り付けて送信してください。');
      } else {
        showCopyNotice('コピーに失敗しました。手動でコピーしてください。');
      }
    }
  });
});
