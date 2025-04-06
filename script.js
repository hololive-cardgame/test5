// 取得元素
const clearFiltersBtn = document.getElementById("clearFilters");  // 清除篩選條件按鈕
const cardContainer = document.getElementById("cardContainer");  // 卡牌展示區

let cardsData = [];  // 所有卡牌資料
let filteredCards = [];  // 篩選後的卡牌資料
let currentPage = 0;  // 初始頁面是第一頁
const cardsPerPage = 5;  // 每頁顯示的卡牌數量
let currentIndex = -1;  // 當前顯示的卡牌索引

// 使用 fetch 從 JSON 檔案載入資料
function loadCardData() {
  const cachedData = localStorage.getItem("cardsData");
  if (cachedData) {
    cardsData = JSON.parse(cachedData);
    filteredCards = cardsData;
    generateFilterOptions();  // 生成篩選選項
    displayCards(cardsData);  // 顯示所有卡牌
  } else {
    fetch("cards.json")
      .then(response => response.json())  // 解析 JSON 資料
      .then(data => {
        cardsData = data;
        filteredCards = data;
        localStorage.setItem("cardsData", JSON.stringify(data));  // 快取
        generateFilterOptions();
        displayCards(cardsData);
      })
      .catch(error => {
        console.error("Error loading the card data:", error);
      });
  }
}
loadCardData();

// 根據 JSON 資料生成篩選選項
function generateFilterOptions() {
  const keywords = new Set();
  const types = new Set();
  const attributes = new Set();
  const blooms = new Set();
  const tags = new Set();
  const sets = {
    "起始牌組": new Set(),
    "補充包": new Set(),
    "其他": new Set()
  };

  // 儲存卡牌名稱的集合
  cardsData.forEach(card => {
    keywords.add(card.name);
    types.add(card.type);
    if (card.attribute) {
      card.attribute.split(" / ").forEach(attr => attributes.add(attr));
    }
    blooms.add(card.bloom);
    if (card.tag) {
        card.tag.split(" / ").forEach(tag => tags.add(tag));
    }
    if (card.set) {
      const cardSets = Array.isArray(card.set) ? card.set : [card.set];
      cardSets.forEach(setItem => {
        if (setItem.includes("起始牌組")) {
          const setName = setItem.replace("起始牌組","").replace(/[「」]/g,"").trim();
          sets["起始牌組"].add(setName);
        } else if (setItem.includes("補充包")) {
          const setName = setItem.replace("補充包","").replace(/[「」]/g,"").trim();
          sets["補充包"].add(setName);
        } else if (setItem === "スタートエールセット" || setItem === "PR卡") {
          sets["其他"].add(setItem);
        }
      });
    }
  });

  // 填充關鍵字選項
  keywords.forEach(keyword => {
    if (keyword) {
      const option = document.createElement("option");
      option.value = keyword;
      option.textContent = keyword;
      $("#keyword").append(option);
    }
  });

  // 初始化類型
  $("#type").select2({
    minimumResultsForSearch: Infinity,
    width: "100%"
  });
  // 監聽篩選條件變動，觸發篩選
  $("#type").on("select2:select", function() {
    filterCards();
  });
  // 填充類型選項
  const allOption = new Option("全部","allOption");
  $("#type").append(allOption);
  types.forEach(type => {
    if (type) {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      $("#type").append(option);
    }
  });
  // 觸發更新
  $("#type").trigger("change");

  // 填充屬性選項
  attributes.forEach(attribute => {
    if (attribute) {
      const option = document.createElement("option");
      option.value = attribute;
      option.textContent = attribute;
      $("#attribute").append(option);
    }
  });

  // 填充綻放等級選項
  blooms.forEach(bloom => {
    if (bloom) {
      const option = document.createElement("option");
      option.value = bloom;
      option.textContent = bloom;
      $("#bloom").append(option);
    }
  });

  // 將 tag 轉換為數組，並進行排序
  const sortedTags = Array.from(tags).sort();
  // 填充標籤選項
  sortedTags.forEach(tag => {
    if (tag) {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      $("#tag").append(option);
    }
  });

  // 卡包排序 hSDxx hBPxx
  function customSort(arr) {
    return arr.sort((a, b) => {
      const extractNumber = (set) => {
        const match = set.match(/h\w+(\d+)/);
        if (match) {
          return parseInt(match[1], 10);  // 返回數字
        }
        return Infinity; // 如果沒有匹配到名稱，放到最後面
      };

      const numberA = extractNumber(a);
      const numberB = extractNumber(b);

      return numberA - numberB;  // 按數字排序
    });
  }
  // 填充卡包選項
  Object.keys(sets).forEach(category => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;  // 設定分組

    // 添加該分類下的所有卡包選項
    const sortedSets = customSort(Array.from(sets[category]));
    sortedSets.forEach(set => {
      const option = document.createElement("option");
      option.value = set;
      option.textContent = set;
      optgroup.appendChild(option);
    });
    $("#set").append(optgroup);
  });

  // 初始化 Select2
  $(document).ready(function() {
    let isInitialized = false;  // 初始化時不進行篩選
    
    // 初始化關鍵字、屬性、綻放等級、標籤、卡包
    $("#keyword, #attribute, #bloom, #tag, #set").select2({
      placeholder: "",
      minimumResultsForSearch: Infinity,
      width: "100%"
    });
    
    // 設定初始值不觸發
    function setSelect2ValueWithoutChange(selector, value) {
      const Select2 = $.fn.select2.amd.require('select2/core');
      const $element = $(selector);
      const instance = $element.data('select2');

      if (instance) {
        instance.triggerChange = false;  // 禁用觸發
        $element.val(value).trigger('change');
        instance.triggerChange = true;  // 重啟觸發
      } else {
        $element.val(value).trigger('change', { triggerChange: false });
      }
    }

    // 初始化選項
    function initializeFilterOptions() {
      setSelect2ValueWithoutChange("#keyword", "");
      setSelect2ValueWithoutChange("#bloom", "");
      setSelect2ValueWithoutChange("#attribute", "");
      setSelect2ValueWithoutChange("#tag", "");
      setSelect2ValueWithoutChange("#set", "");
    }
    initializeFilterOptions();

    // 監聽篩選條件變動，觸發篩選
    $('#attribute').on('change', function() {
      if (isInitialized) {
        filterCards();
      }
    });
    $("#keyword, #bloom, #tag, #set").on("select2:select", function() {
      if (isInitialized) {
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).show();  // 顯示自定義清除按鈕
        filterCards();
      }
    });
    // 監聽 Select2 的清除事件
    $("#keyword, #bloom, #tag, #set").on("select2:clear", function() {
      if (isInitialized) {
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).hide();  // 隱藏自定義清除按鈕
        console.log('Select2 clear event triggered for:', this.id);
        $(this).select2('close');
        filterCards();
      }
    });
    // 自定義清除按鈕被點擊時
    $("#clearKeyword, #clearBloom, #clearTag, #clearSet").on("click", function() {
      var target = $(this).attr("id").replace("clear", "").toLowerCase();  // 提取ID
      $("#" + target).val("").trigger("change").select2("close");  // 清空選擇框的值並觸發更新、手動關閉下拉選單
      $(this).hide();  // 隱藏清除按鈕
      filterCards();
    });
    // 初始化自定義清除按鈕狀態
    $("#keyword, #bloom, #tag, #set").each(function() {
      if ($(this).val() === "") {  // 當沒有選擇任何項目時，隱藏清除按鈕
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).hide();
      }
    });
    // 初始化完成，進行篩選
    isInitialized = true;
  });
}

// 清除篩選條件按鈕
clearFiltersBtn.addEventListener("click", () => {
  // 檢查是否有任何篩選條件被選擇
  const isAnyFilterSelected = $("#keyword").val() ||
                              $("#type").val() !== "allOption" ||
                              $("#bloom").val() ||
                              ($("#attribute").val() && $("#attribute").val().length > 0) ||
                              $("#tag").val() ||
                              $("#set").val();
  
  if (isAnyFilterSelected) {
    // 如果有篩選條件被選擇，則清除所有篩選條件
    $("#keyword, #attribute, #bloom, #tag, #set").val("").trigger("change");
    $("#attribute").val([]).trigger("change");  // 單獨處理 attribute 篩選條件，設為空數組並觸發更新
    $("#type").val("allOption").trigger("change");
    $("#clearKeyword, #clearBloom, #clearTag, #clearSet").hide();  // 隱藏清除按鈕
    displayCards(cardsData);
  }
});

// 顯示卡牌
function displayCards(cards) {
  cardContainer.innerHTML = "";  // 清空現有卡牌

  // 計算當前頁面的開始和結束索引
  const startIndex = currentPage * cardsPerPage;
  const endIndex = Math.min(startIndex + cardsPerPage, cards.length);

  // 如果沒有卡牌，顯示提示訊息
  if (cards.length === 0) {
    cardContainer.innerHTML = '<p>沒有符合的資料</p>';
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    const card = cards[i];
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.innerHTML = `
      <img src="${card.image}" alt="${card.name}">
    `;

    // 點擊卡牌展示詳細資訊
    cardElement.addEventListener("click", () => {
      currentIndex = i;
      showPopup(card, currentIndex);
    });
    cardContainer.appendChild(cardElement);
  }
  // 生成分頁
  generatePaginationControls(cards.length);
}

// 分頁控制
function generatePaginationControls(totalCards) {
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  const paginationContainer = document.getElementById("pagination");  // 分頁按鈕
  paginationContainer.innerHTML = "";  // 清空現有分頁

  const maxPageButtons = 5;  // 最大頁碼數量（不包括省略號）
  const firstPage = 0;  // 第一頁的索引
  const lastPage = totalPages - 1;  // 最後一頁的索引

  // 計算顯示頁碼的範圍
  let startPage, endPage;

  if (totalPages <= maxPageButtons) {
    // 如果總頁數小於等於最大頁碼數量，則顯示所有頁碼
    startPage = firstPage;
    endPage = lastPage;
  } else {
    if (currentPage <= 2) {
      // 當前頁碼小於等於 2（即處於第 1、2 或 3 頁），則顯示從第 1 頁到最多 5 頁的頁碼
      startPage = firstPage;
      endPage = maxPageButtons - 1;
    } else if (currentPage >= totalPages - 3) {
      // 當前頁碼大於等於總頁數減去 3（即接近最後 3 頁），則顯示最後 5 頁的頁碼
      startPage = totalPages - maxPageButtons;
      endPage = lastPage;
    } else {
      // 當頁碼處於中間範圍時，顯示當前頁碼前後各 2 頁
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }
  }

  // 分頁左箭頭
  const leftArrow = document.createElement("div");
  leftArrow.classList.add("pagination-arrow");
  leftArrow.innerHTML = `
    <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowBackIosRoundedIcon">
      <path d="M16.62 2.99c-.49-.49-1.28-.49-1.77 0L6.54 11.3c-.39.39-.39 1.02 0 1.41l8.31 8.31c.49.49 1.28.49 1.77 0s.49-1.28 0-1.77L9.38 12l7.25-7.25c.48-.48.48-1.28-.01-1.76z"></path>
    </svg>
  `;
  
  if (currentPage > 0) {
    leftArrow.addEventListener("click", () => {
      currentPage--;
      displayCards(filteredCards);  // 更新顯示的卡牌
      scrollToTop();
    });
  } else {
    leftArrow.classList.add("disabled");  // 添加禁用
  }
  paginationContainer.appendChild(leftArrow);
  
  // 確保顯示第一頁
  if (startPage > firstPage) {
    const firstPageButton = document.createElement("div");
    firstPageButton.textContent = firstPage + 1;
    firstPageButton.classList.add("pagination-button");
    if (currentPage === firstPage) {
      firstPageButton.classList.add("active");
    }
    firstPageButton.addEventListener("click", () => {
      currentPage = firstPage;
      displayCards(filteredCards);  // 點擊分頁按鈕時更新顯示的卡牌
      scrollToTop();
    });
    paginationContainer.appendChild(firstPageButton);

    // 添加省略號
    if (startPage > firstPage + 1) {
      const ellipsisButton = document.createElement("span");
      ellipsisButton.textContent = "...";
      paginationContainer.appendChild(ellipsisButton);
    }
  }

  // 分頁按鈕
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("div");
    pageButton.textContent = i + 1;
    pageButton.classList.add("pagination-button");
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => {
      currentPage = i;
      displayCards(filteredCards);  // 點擊分頁按鈕時更新顯示的卡牌
      scrollToTop();
    });
    paginationContainer.appendChild(pageButton);
  }

  // 確保顯示最後一頁
  if (endPage < lastPage) {
    // 添加省略號
    if (endPage < lastPage - 1) {
      const ellipsisButton = document.createElement("span");
      ellipsisButton.textContent = "...";
      paginationContainer.appendChild(ellipsisButton);
    }

    const lastPageButton = document.createElement("div");
    lastPageButton.textContent = lastPage + 1;
    lastPageButton.classList.add("pagination-button");
    if (currentPage === lastPage) {
      lastPageButton.classList.add("active");
    }
    lastPageButton.addEventListener("click", () => {
      currentPage = lastPage;
      displayCards(filteredCards);  // 點擊分頁按鈕時更新顯示的卡牌
      scrollToTop();
    });
    paginationContainer.appendChild(lastPageButton);
  }

  // 分頁右箭頭
  const rightArrow = document.createElement("div");
  rightArrow.classList.add("pagination-arrow");
  rightArrow.innerHTML = `
    <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowForwardIosRoundedIcon">
      <path d="M7.38 21.01c.49.49 1.28.49 1.77 0L17.46 12.7c.39-.39.39-1.02 0-1.41l-8.31-8.31c-.49-.49-1.28-.49-1.77 0s-.49 1.28 0 1.77L14.62 12l-7.25 7.25c-.48.48-.48 1.28.01 1.76z"></path>
    </svg>
  `;
  
  if (currentPage < totalPages - 1) {
    rightArrow.addEventListener("click", () => {
      currentPage++;
      displayCards(filteredCards);  // 更新顯示的卡牌
      scrollToTop();
    });
  } else {
    rightArrow.classList.add("disabled");  // 添加禁用
  }
  paginationContainer.appendChild(rightArrow);  
}

// 根據篩選條件顯示卡牌
function filterCards() {
  // 獲取篩選條件
  const keyword = $("#keyword").val();
  const type = $("#type").val();
  const bloom = $("#bloom").val();
  const selectedAttributes = $("#attribute").val() || [];
  const tag = $("#tag").val();
  const set = $("#set").val();
  
  filteredCards = cardsData.filter(card => {
    // 逐個條件篩選
    const matchesKeyword = keyword ? card.name.toLowerCase().includes(keyword.toLowerCase()) : true;  // 如果 keyword 不為空，則篩選符合關鍵字的卡牌
    const matchesType = type && type !== "allOption" ? card.type === type : true;  // 類型選擇框預設為 "allOption"，如果不為空則篩選
    const matchesBloom = bloom ? card.bloom && card.bloom.includes(bloom) : true;
    const matchesAttribute = selectedAttributes.length === 0 || selectedAttributes.some(attr => card.attribute && card.attribute.split(' / ').includes(attr));
    const matchesTag = tag ? card.tag && card.tag.split(' / ').includes(tag) : true;
    const matchesSet = set ? (card.set && Array.isArray(card.set) ? card.set.some(s => s.includes(set)) : card.set.includes(set)) : true;

    // 返回符合所有條件的卡牌
    return matchesKeyword && matchesType && matchesBloom && matchesAttribute && matchesTag && matchesSet;
  });
  currentPage = 0;
  displayCards(filteredCards);
}

// 顯示卡牌的詳細資訊
function showPopup(card, index) {
  document.body.style.overflow = "hidden";  // 禁用背景滾動
  
  // 獲取彈窗內容區域
  const leftContent = document.getElementById('popupLeft');
  const rightContent = document.getElementById('popupRight');

  leftContent.innerHTML = '';
  rightContent.innerHTML = '';
  
  // 創建新的 <img> 元素
  const imageElement = document.createElement('img');
  imageElement.id = `popupImage-${index}`;  // 使用唯一的 id
  imageElement.src = card.image;
  imageElement.alt = card.name;

  // 將新創建的圖片元素插入到左側區域
  leftContent.appendChild(imageElement);

  // 處理卡包字段
  const cardSets = Array.isArray(card.set) ? card.set : [card.set];  // 確保 card.set 是數組
  const setItems = cardSets.map(setItem => {
    const setName = setItem.replace(/\(.*\)/, "").trim();  // 去掉括號及其中內容
    return setName;
  });

  // 處理支持效果的字段，將 \n 轉換為 <br>，並且將 \n\n 轉換為 <br><br> (空行)
  const supportEffect = card.supportEffect
    ? card.supportEffect.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>")
    : "";

  // 填充右側詳細資料
  let rightHtml = `
    <h2>${card.name}</h2>
  `;

  if (card.type === "主推") {
    rightHtml += `
      <div class="oshi-details">
        <div class="info">
            <dl>
              <dt class="label">類型</dt>
              <dd>${card.type}</dd>
              <dt class="label">収録商品</dt>
              <dd>${setItems.join('<br>')}</dd>
              <dt class="label">顏色</dt>
              <dd>${card.color}</dd>
              <dt class="label">生命值</dt>
              <dd>${card.life}</dd>
            </dl>
        </div>

        <div class="oshi-info">
            <span class="label">主推技能</span>
            <div class="oshi skill">
              <span class="holoPower">[holo能量：${card.oshiSkill.holoPower}]</span>
              <span class="oshiSkill name">${card.oshiSkill.name}</span>
              <span class="oshiSkill effect">${card.oshiSkill.effect}</span>
            </div>
          </div>
        
          <div class="oshi-info">
            <span class="label">SP主推技能</span>
            <div class="sp skill">
              <span class="holoPower">[holo能量：${card.spSkill.holoPower}]</span>
              <span class="spSkill name">${card.spSkill.name}</span>
              <span class="spSkill effect">${card.spSkill.effect}</span>
            </div>
          </div>
        
          <div class="oshi-info">
            <span class="label">卡牌編號</span>
            <span>${card.id}</span>
        </div>
      </div>`;
  }


  /*
  if (card.type === "主推") {
    rightHtml += `
      <div class="oshi-details">
        <div class="oshi-info">
          <span class="label">類型</span>
          <span>${card.type}</span>
        </div>
        
        <div class="oshi-info">
          <span class="label">收錄商品</span>
          <ul class="product-list">
            ${setItems.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="oshi-info">
          <span class="label">顏色</span>
          <span>${card.color}</span>
        </div>
        
        <div class="oshi-info">
          <span class="label">生命值</span>
          <span>${card.life}</span>
        </div>
        
        <div class="oshi-info">
          <span class="label">主推技能</span>
          <div class="oshi skill">
            <span class="holoPower">[holo能量：${card.oshiSkill.holoPower}]</span>
            <span class="oshiSkill name">${card.oshiSkill.name}</span>
            <span class="oshiSkill effect">${card.oshiSkill.effect}</span>
          </div>
        </div>
        
        <div class="oshi-info">
          <span class="label">SP主推技能</span>
          <div class="sp skill">
            <span class="holoPower">[holo能量：${card.spSkill.holoPower}]</span>
            <span class="spSkill name">${card.spSkill.name}</span>
            <span class="spSkill effect">${card.spSkill.effect}</span>
          </div>
        </div>
        
        <div class="oshi-info">
          <span class="label">卡牌編號</span>
          <span>${card.id}</span>
        </div>
      </div>`;
  }
  */

  
/*
  if (card.type === "主推") {
    rightHtml += `
      <div id="popupOshiType">
        <div class="info">
          <dl>
            <dt class="label">類型</dt>
            <dd>${card.type}</dd>
            <dt class="label">収録商品</dt>
            <dd>${setItems.join('<br>')}</dd>
            <dt class="label">屬性</dt>
            <dd>${card.attribute}</dd>
            <dt class="label">生命值</dt>
            <dd>${card.life}</dd>
          </dl>
        </div>

        <div class="oshi skill">
          <p class="label skill">主推技能</p>
          <p>[holo能量：${card.oshiSkill.holoPower}]<span>${card.oshiSkill.name}</span>${card.oshiSkill.effect}</p>
        </div>

        <div class="sp skill">
          <p class="label spSkill">SP主推技能</p>
          <p>[holo能量：${card.spSkill.holoPower}]<span>${card.spSkill.name}</span>${card.spSkill.effect}</p>
        </div>

        <div class="illustrator">
          <p class="id">カードナンバー：<span>${card.id}</span></p>
      </div>
      
      </div>`;
  }
*/






  /*
  let rightHtml = `
    <h2>${card.name}</h2>
    <p><strong><span class="label">類型</span></strong> ${card.type}</p>
  `;

  if (card.type === "主推") {
    // 解析主推技能和 SP 主推技能
    const skill = parseSkill(card.skill, "主推技能");
    const spSkill = parseSkill(card.spSkill, "SP主推技能");
    
    rightHtml += `
      <div id="popupOshiType">
        <p><strong><span class="label">屬性</span></strong> ${card.attribute}</p>
        <p><strong><span class="label">生命值</span></strong> ${card.life}</p>
        
        <!-- 主推技能 -->
        <p><strong><span class="label skill">${skill.label}</span></strong>
          <span class="skill-holoPower">${skill.holoPower}</span></p>
        <p class="skill-name">${skill.name}</p>
        <p class="skill-description">${skill.description}</p>

        <!-- SP主推技能 -->
        <p><strong><span class="label spSkill">${spSkill.label}</span></strong>
          <span class="spSkill-holoPower">${spSkill.holoPower}</span></p>
        <p class="spSkill-name">${spSkill.name}</p>
        <p class="spSkill-description">${spSkill.description}</p>

        <!-- 卡包 -->
        <p><strong><span class="label">卡包</span></strong> ${setItems[0]}</p>
        ${setItems.slice(1).map(set => `<p class="set-indent">${set}</p>`).join('')}

        <p><strong><span class="label">卡牌編號</span></strong> ${card.id}</p>
      </div>`;
  }
  */

  /*
  // 填充右側詳細資料
  let rightHtml = `
    <h2>${card.name}</h2>
    <p><strong><span class="label">類型</span></strong> ${card.type}</p>
  `;

  if (card.type === "主推") {
    rightHtml += `
      <div id="popupOshiType">
        <p><strong><span class="label">屬性</span></strong> ${card.attribute}</p>
        <p><strong><span class="label">生命值</span></strong> ${card.life}</p>
        <p><strong><span class="label skill">主推技能</span></strong> ${card.skill}</p>
        <p><strong><span class="label spSkill">SP主推技能</span></strong> ${card.spSkill}</p>
        <p><strong><span class="label">卡包</span></strong> ${card.set}</p>
        <p><strong><span class="label">卡牌編號</span></strong> ${card.id}</p>
      </div>`;
  } else if (card.type === "成員") {
    rightHtml += `
      <div id="popupHolomenType">
        <p><strong><span class="label">綻放等級</span></strong> ${card.bloom}</p>
        <p><strong><span class="label">標籤</span></strong> ${card.tag}</p>
        <p><strong><span class="label">屬性</span></strong> ${card.attribute}</p>
        <p><strong><span class="label">體力</span></strong> ${card.hp}</p>
        ${card.collabEffect ? `<p><strong><span class="label collab">聯動</span></strong> ${card.collabEffect}</p>` : ''}
        ${card.bloomEffect ? `<p><strong><span class="label bloom">綻放</span></strong> ${card.bloomEffect}</p>` : ''}
        ${card.giftEffect ? `<p><strong><span class="label gift">天賦</span></strong> ${card.giftEffect}</p>` : ''}
        ${card.skill1 ? `
          <p>
            <strong><span class="label skill1">藝能</span></strong>
            <div style="display: flex; flex-direction: row; gap: 8px; align-items: center; white-space: nowrap;">
              ${card.skill1.images.map(image => `
                <img src="${image}" alt="Skill Image" style="width: 24%; max-height: 300px; object-fit: contain;">
              `).join('')}
            </div>
            ${card.skill1.description ? `
              <div>
                <span>${card.skill1.description}</span>
              </div>
            ` : ''}
          </p>
        ` : ''}
        ${card.skill2 ? `
          <p>
            <strong><span class="label skill1">藝能</span></strong>
            <div style="display: flex; flex-direction: row; gap: 8px; align-items: center; white-space: nowrap;">
              ${card.skill2.images.map(image => `
                <img src="${image}" alt="Skill Image" style="width: 24%; max-height: 300px; object-fit: contain;">
              `).join('')}
            </div>
            ${card.skill2.description ? `
              <div>
                <span>${card.skill2.description}</span>
              </div>
            ` : ''}
          </p>
        ` : ''}
        <p><strong><span class="label">交棒</span></strong>
          ${card.batonImage[0] ? `<img id="popupBatonImage1" src="${card.batonImage[0]}" alt="Baton Image 1" style="width: 48%; max-height: 300px; object-fit: contain; margin-right: 4%;">` : ''}
          ${card.batonImage[1] ? `<img id="popupBatonImage2" src="${card.batonImage[1]}" alt="Baton Image 2" style="width: 48%; max-height: 300px; object-fit: contain;">` : ''}
        </p>
        ${card.rule ? `<p><strong><span class="label rule">特殊規則</span></strong> ${card.rule}</p>` : ''}
        <p><strong><span class="label">卡包</span></strong> ${card.set}</p>
        <p><strong><span class="label">卡牌編號</span></strong> ${card.id}</p>
      </div>`;
  } else if (card.type.includes("支援")) {
    rightHtml += `
      <div id="popupSupportType">
        ${card.tag ? `<p><strong><span class="label">標籤</span></strong> ${card.tag}</p>` : ''}
        <p><strong><span class="label">效果</span></strong> ${card.supportEffect}</p>
        <p><strong><span class="label">卡包</span></strong> ${card.set}</p>
        <p><strong><span class="label">卡牌編號</span></strong> ${card.id}</p>
      </div>`;
  } else if (card.type === "吶喊") {
    rightHtml += `
      <div id="popupYellType">
        <p><strong><span class="label">屬性</span></strong> ${card.attribute}</p>
        <p><strong><span class="label">效果</span></strong> ${card.yellEffect}</p>
        <p><strong><span class="label">卡包</span></strong> ${card.set}</p>
        <p><strong><span class="label">卡牌編號</span></strong> ${card.id}</p>
      </div>`;
  }
  */
  
  rightContent.innerHTML = rightHtml;

  // 顯示彈窗
  document.getElementById('popup').style.display = 'flex';

  // 設置左右箭頭的事件，基於篩選後的卡牌
  document.getElementById('arrowLeft').onclick = () => {
    const previousIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;  // 處理循環
    currentIndex = previousIndex;  // 更新目前索引
    showPopup(filteredCards[previousIndex], previousIndex);  // 顯示上一張卡牌
  };
  document.getElementById('arrowRight').onclick = () => {
    const nextIndex = (currentIndex + 1) % filteredCards.length;  // 處理循環
    currentIndex = nextIndex;  // 更新目前索引
    showPopup(filteredCards[nextIndex], nextIndex);  // 顯示下一張卡牌
  };
}

// 關閉彈窗
document.getElementById('closePopup').addEventListener('click', function() {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
  document.body.style.overflow = "auto";  // 恢復背景滾動
});

// 點擊彈窗外部區域關閉彈窗
document.getElementById("popup").addEventListener("click", (e) => {
  if (e.target === document.getElementById("popup")) {
    document.getElementById("popup").style.display = "none";
    document.body.style.overflow = "auto";  // 恢復背景滾動
  }
});

// 滾動到頁面最上方
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 滾動隱藏 header
let lastScrollTop = 0;  // 上次滾動的位置
let hideThreshold = 100;  // 滾動距離達到 100px 時才開始隱藏 header

window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop && currentScroll > hideThreshold) {
    // 滾動往下，隱藏 header
    header.classList.add('hidden');
  } else {
    // 滾動往上，顯示 header
    header.classList.remove('hidden');
  }

  // 更新滾動位置
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;  // 防止滾動過多
});
