const paginationContainer = document.getElementById("pagination");  // 分頁
const clearFiltersBtn = document.getElementById("clearFilters");  // 清除篩選條件按鈕
const cardContainer = document.getElementById("cardContainer");  // 卡牌展示區
const filterBtn = document.getElementById('filterBtn');  // 小視窗篩選按鈕
const leftSide = document.querySelector('.left-side');  // 篩選條件區塊
const resultCount = document.getElementById("resultCount");  // 搜尋結果筆數
const noCardsWrapper = document.querySelector('.noCardsWrapper');  // 沒有卡牌區塊
const overlay = document.getElementById("overlay");  // 小視窗遮罩

let isFiltering = false;  // 點擊清除篩選條件按鈕時不進行篩選
let isInitialized = false;  // 初始化時不進行篩選

let cardsData = [];  // 所有卡牌資料
let filteredCards = [];  // 篩選後的卡牌資料
let currentPage = 0;  // 初始頁面是第一頁
let cardsPerPage = 40;  // 每頁顯示的卡牌數量
let currentIndex = -1;  // 當前顯示的卡牌索引
let isLoading = false;  // 防止重複加載
let isMobileView = window.innerWidth < 1024;  // 初始值，根據當前螢幕大小判斷
let observer = null;
let sentinel = null;

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

// Step 1: 自定義拼音對照表
const customRomajiMap = {
  // 0期生
  "子": ["ko","co"],
  "ロボ子さん": "robocosan",
  "星街": "hoshimachi",
  // 1期生
  "ローゼンタール": ["rozentaru","rosenthal"],
  "アキ・ローゼンタール": ["akirozentaru","akirosenthal"],
  "赤井": "akai",
  "白上": "shirakami",
  "夏色": "natsuiro",
  // 2期生
  "紫咲": "murasaki",
  "百鬼": "nakiri",
  "癒月": "yuzuki",
  "ちょこ": "choco",
  "癒月ちょこ": "yuzukichoko",
  "大空": "oozora",
  // GAMERS
  "大神": "ookami",
  "猫又": "nekomata",
  "戌神": "inugami",
  // 3期生
  "兎田": "usada",
  "不知火": "shiranui",
  "フレア": ["furea","flare"],
  "不知火フレア": "shiranuifurea",
  "白銀": "shirogane",
  "ノエル": ["noeru","noel"],
  "白銀ノエル": "shiroganenoeru",
  "宝鐘": "houshou",
  "マリン": "marine",
  // 4期生
  "天音": "amane",
  "角巻": "tsunomaki",
  "常闇": "tokoyami",
  "姫森": "himemori",
  "ルーナ": ["runa","luna"],
  "姫森ルーナ": "himemoriluna",
  // 5期生
  "雪花": "yukihana",
  "ラミィ": "lamy",
  "雪花ラミィ": "yukihanaramyi",
  "桃鈴": "momosuzu",
  "獅白": "shishiro",
  "尾丸": "omaru",
  "ポルカ": "polka",
  "尾丸ポルカ": "omaruporuka",
  // holoX
  "ラプラス": ["la+","laplus"],
  "ダークネス": ["dakunesu","darknesss"],
  "ラプラス・ダークネス": ["rapurasudakunesu","la+darknesss","laplusdarknesss"],
  "鷹嶺": "takane",
  "ルイ": "lui",
  "鷹嶺ルイ": "takanerui",
  "博衣": "hakui",
  "沙花叉": "sakamata",
  "クロヱ": ["kuroe","chloe"],
  "沙花叉クロヱ": "sakamatachloe",
  "風真": "kazama",
  // ReGLOSS
  "火威": "hiodoshi",
  "青": "ao",
  "音乃瀬": "otonose",
  "奏": "kanade",
  "一条": "ichijou",
  "莉々華": "ririka",
  "儒烏風亭": "juufuutei",
  "轟": "todoroki",
  // FLOW GLOW
  "響咲": "isaki",
  "虎金妃": "koganei",
  "笑虎": "niko",
  "水宮": "mizumiya",
  "枢": "su",
  "輪堂": "rindo",
  "千速": "chihaya",
  "綺々羅々": "kikirara",
  // ID1期生
  "ムーナ": ["muna","moona"],
  "ホシノヴァ" : "hoshinova",
  "ムーナ・ホシノヴァ": ["munahoshinova","moonahoshinova"],
  "イオフィフティーン": ["iofyifuthin","iofifteen"],
  "アイラニ・イオフィフティーン": ["airaniiofyifuthin","airaniiofifteen"],
  // ID2期生
  "オリー": "ollie",
  
  /*

  
  // 職員
  "春先": "harusaki",
  
  
  // ID2期生
  "クレイジー・オリー": ["kureijiollie","kureijiori"],
  "オリー": ["ollie","ori"],
  "パヴォリア・レイネ": ["pavoliareine","pavuoriareine"],
  "パヴォリア": ["pavolia","pavuoria"],
  // ID3期生
  
  // 可持續擴充...
  */
};

// Step 2: 統一文字處理
function normalizeTextAdvanced(text) {
  return wanakana.toRomaji(
    text
      .normalize("NFKC")          // 全形轉半形
      .replace(/[\s·・\-_]/g, '') // 移除空白、連字號等常見符號
      .toLowerCase()              // 小寫統一
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Step 3: Select2 自定義 matcher
function romajiMatcher(params, data) {
  // 沒輸入 ➝ 返回所有選項
  if ($.trim(params.term) === '') {
    return data;
  }
  if (!data.text) return null;

  const keyword = normalizeTextAdvanced(params.term);
  const originalText = data.text;
  const normalizedText = normalizeTextAdvanced(originalText);

  // 普通比對（英文、日文假名、羅馬拼音）
  if (normalizedText.includes(keyword)) {
    return data;
  }

  // 額外檢查漢字對應拼音
const matchByRomaji = Object.entries(customRomajiMap).some(([kanji, romaji]) => {
    if (originalText.includes(kanji)) {
      const romajiList = Array.isArray(romaji) ? romaji : [romaji];
      return romajiList.some(r => normalizeTextAdvanced(r).includes(keyword));
    }
    return false;
  });

  if (matchByRomaji) {
    return data;
  }

/// 3. 整段轉 romaji 並根據 map 進行替換
  let baseRomaji = normalizeTextAdvanced(wanakana.toRomaji(originalText));

Object.entries(customRomajiMap).forEach(([kanji, romaji]) => {
    const romajiList = Array.isArray(romaji) ? romaji : [romaji];
  const kanjiRomaji = normalizeTextAdvanced(wanakana.toRomaji(kanji));
    romajiList.forEach(r => {
      baseRomaji = baseRomaji.replace(
        new RegExp(escapeRegExp(kanjiRomaji), 'g'),
        normalizeTextAdvanced(r)
      );
    });
  });

  if (baseRomaji.includes(keyword)) {
    return data;
  }

  return null; // 沒命中
}

// 根據 JSON 資料生成篩選選項
function generateFilterOptions() {
  const keywords = new Set();
  const types = new Set();
  const colors = new Set();
  const blooms = new Set();
  const tags = new Set();
  const products = {
    "起始牌組": new Set(),
    "補充包": new Set(),
    "其他": new Set()
  };

  // 儲存卡牌名稱的集合
  cardsData.forEach(card => {
    keywords.add(card.name);
    types.add(card.type);
    if (card.color) {
      card.color.split(" / ").forEach(color => colors.add(color));
    }
    blooms.add(card.bloom);
    if (card.tag) {
        card.tag.split(" / ").forEach(tag => tags.add(tag));
    }
    if (card.product) {
      const cardProducts = Array.isArray(card.product) ? card.product : [card.product];
      cardProducts.forEach(productItem => {
        if (productItem.includes("起始牌組")) {
          const setName = productItem.replace("起始牌組","").replace(/[「」]/g,"").trim();
          products["起始牌組"].add(setName);
        } else if (productItem.includes("補充包")) {
          const setName = productItem.replace("補充包","").replace(/[「」]/g,"").trim();
          products["補充包"].add(setName);
        } else if (productItem === "スタートエールセット" || productItem === "PR卡") {
          products["其他"].add(productItem);
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
    if (isInitialized && !isFiltering) {
      filterCards();
    }
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
  $("#type").trigger("change");  // 觸發更新

  // 填充顏色選項
  colors.forEach(color => {
    if (color) {
      const option = document.createElement("option");
      option.value = color;
      option.textContent = color;
      $("#color").append(option);
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

  const sortedTags = Array.from(tags).sort();  // 將標籤轉換為數組，並進行排序
  // 填充標籤選項
  sortedTags.forEach(tag => {
    if (tag) {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      $("#tag").append(option);
    }
  });

  // 收錄商品排序 hSDxx hBPxx
  function customSort(arr) {
    return arr.sort((a, b) => {
      const extractNumber = (set) => {
        const match = set.match(/h\w+(\d+)/);
        if (match) {
          return parseInt(match[1], 10);  // 返回數字
        }
        return Infinity;  // 如果沒有匹配到名稱，放到最後面
      };

      const numberA = extractNumber(a);
      const numberB = extractNumber(b);

      return numberA - numberB;  // 按數字排序
    });
  }
  // 填充收錄商品選項
  Object.keys(products).forEach(category => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;  // 設定分組

    // 添加該分類下的所有收錄商品選項
    const sortedProducts = customSort(Array.from(products[category]));
    sortedProducts.forEach(product => {
      const option = document.createElement("option");
      option.value = product;
      option.textContent = product;
      optgroup.appendChild(option);
    });
    $("#product").append(optgroup);
  });

  // 初始化 Select2
  $(document).ready(function() {
    // 初始化關鍵字、標籤
    $("#keyword, #tag").select2({
      matcher: romajiMatcher,
      placeholder: "",
      width: "100%"
    });
    // 初始化顏色、綻放等級、收錄商品
    $("#color, #bloom, #product").select2({
      placeholder: "",
      minimumResultsForSearch: Infinity,
      width: "100%"
    });
    
    // 設定初始值
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
      setSelect2ValueWithoutChange("#color", "");
      setSelect2ValueWithoutChange("#tag", "");
      setSelect2ValueWithoutChange("#product", "");
    }
    initializeFilterOptions();

    // 監聽篩選條件變動，觸發篩選
    $('#color').on('change', function() {
      if (isInitialized && !isFiltering) {
        filterCards();
      }
    });
    // 展開下拉選單游標
    $("#keyword, #tag").on('select2:open', function () {
      setTimeout(() => {
        document.querySelector('.select2-container--open .select2-search__field')?.focus();
      }, 0);
    });
    $("#keyword, #bloom, #tag, #product").on("select2:select", function() {
      if (isInitialized && !isFiltering) {
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).show();  // 顯示自定義清除按鈕
        filterCards();
      }
    });
    // 監聽 Select2 的清除事件
    $("#keyword, #bloom, #tag, #product").on("select2:clear", function() {
      if (isInitialized && !isFiltering) {
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).hide();  // 隱藏自定義清除按鈕
        console.log('Select2 clear event triggered for:', this.id);
        $(this).select2('close');
        filterCards();
      }
    });
    // 自定義清除按鈕被點擊時
    $("#clearKeyword, #clearBloom, #clearTag, #clearProduct").on("click", function() {
      var target = $(this).attr("id").replace("clear", "").toLowerCase();  // 提取ID
      isFiltering = true;
      $("#" + target).val("").trigger("change").select2("close");  // 清空選擇框的值並觸發更新、手動關閉下拉選單
      $(this).hide();  // 隱藏清除按鈕
      filterCards();
      isFiltering = false;
    });
    // 初始化自定義清除按鈕狀態
    $("#keyword, #bloom, #tag, #product").each(function() {
      if ($(this).val() === "") {  // 當沒有選擇任何項目時，隱藏清除按鈕
        $("#clear" + this.id.charAt(0).toUpperCase() + this.id.slice(1)).hide();
      }
    });
    isInitialized = true;  // 初始化完成，進行篩選

    // 手機觸控
    const buttons = document.querySelectorAll('.arrow-left, .arrow-right, .close-popup, #filterBtn');

    buttons.forEach(btn => {
      // 當按下時，加入 active 類別
      btn.addEventListener('touchstart', () => {
        btn.classList.add('active');
      });

      // 當觸控結束時，移除 active 類別
      btn.addEventListener('touchend', () => {
        btn.classList.remove('active');
      });

      // 當觸控被取消時，移除 active 類別
      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('active');
      });
    });
  });
}

// 清除篩選條件按鈕
clearFiltersBtn.addEventListener("click", () => {
  isFiltering = true;
  // 檢查是否有任何篩選條件被選擇
  const isAnyFilterSelected = $("#keyword").val() ||
                              $("#type").val() !== "allOption" ||
                              $("#bloom").val() ||
                              ($("#color").val() && $("#color").val().length > 0) ||
                              $("#tag").val() ||
                              $("#product").val();
  
  if (isAnyFilterSelected) {
    // 如果有篩選條件被選擇，則清除所有篩選條件
    $("#keyword, #color, #bloom, #tag, #product").val("").trigger("change");
    $("#color").val([]).trigger("change");  // 單獨處理 color 篩選條件，設為空數組並觸發更新
    $("#type").val("allOption").trigger("change");
    $("#clearKeyword, #clearBloom, #clearTag, #clearProduct").hide();  // 隱藏清除按鈕
    filterCards();
  }
  isFiltering = false;
});

// 顯示卡牌
function displayCards(cards) {
  cardContainer.innerHTML = "";  // 清空現有卡牌
  cleanupLazyLoad();  // 移除懶加載相關

  // 如果沒有卡牌，顯示提示訊息
  if (cards.length === 0) {
    cardContainer.innerHTML = '';
    resultCount.innerText = "";
    noCardsWrapper.classList.remove('hidden');
    paginationContainer.innerHTML = "";
    return;
  } else {
    noCardsWrapper.classList.add('hidden');
    resultCount.innerHTML = `搜尋結果共 <span class="count-number">${cards.length}</span> 筆`;
  }

  // 根據螢幕寬度調整卡片顯示方式
  if (window.innerWidth < 1024) {
    cardsPerPage = 18;
    currentPage = 0;
    setupLazyLoad();  // 啟用懶加載
    return;
  } else  {
    cardsPerPage = 40;
    generatePaginationControls(cards.length);  // 生成分頁
  }

  // 計算當前頁面的開始和結束索引
  const startIndex = currentPage * cardsPerPage;
  const endIndex = Math.min(startIndex + cardsPerPage, cards.length);

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
}

// 分頁控制
function generatePaginationControls(totalCards) {
  const totalPages = Math.ceil(totalCards / cardsPerPage);
  paginationContainer.innerHTML = "";  // 清空現有分頁

  const maxPageButtons = 5;  // 最大頁碼數量（不包括省略號）
  const firstPage = 0;  // 第一頁的索引
  const lastPage = totalPages - 1;  // 最後一頁的索引

  let startPage, endPage;  // 計算顯示頁碼的範圍

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

// 懶加載控制
function setupLazyLoad() {
  if (observer || sentinel) return;

  // 創建一個觀察器來監控是否滾動到頁面底部
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoading) {
        isLoading = true;
        loadMoreCards();  // 當滾動到頁面底部時加載更多卡片
      }
    });
  }, {
    rootMargin: '100px',  // 當元素距離底部 100px 時觸發
    threshold: 1.0  // 完全進入視口
  });

  // 在頁面底部創建一個目標元素，當它進入視口時觸發加載
  sentinel = document.createElement("div");
  sentinel.classList.add("sentinel");
  document.body.appendChild(sentinel);
  observer.observe(sentinel);
}

// 懶加載更多卡片
function loadMoreCards() {
  if (filteredCards.length === 0) return;
  
  const startIndex = currentPage * cardsPerPage;
  const endIndex = Math.min(startIndex + cardsPerPage, filteredCards.length);

  for (let i = startIndex; i < endIndex; i++) {
    const card = filteredCards[i];
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

  currentPage++;  // 更新當前頁面
  isLoading = false;  // 加載完成
}

// 移除懶加載相關
function cleanupLazyLoad() {
  if (observer && sentinel) {
    observer.unobserve(sentinel);
    observer.disconnect();
    sentinel.remove();
    observer = null;
    sentinel = null;
    isLoading = false;
  }
}

// 當視窗大小跨過 1024px 時，重新加載卡牌
window.addEventListener('resize', () => {
  const nowIsMobile = window.innerWidth < 1024;
  if (nowIsMobile !== isMobileView) {
    isMobileView = nowIsMobile;

    if (nowIsMobile) {
      displayCards(filteredCards);
    } else {
      currentPage = 0;
      displayCards(filteredCards);
      window.scrollTo(0, 0);
      resetLeftSideForDesktop();
    }
  }
});

// 根據篩選條件顯示卡牌
function filterCards() {
  // 獲取篩選條件
  const keyword = $("#keyword").val();
  const type = $("#type").val();
  const bloom = $("#bloom").val();
  const colors = $("#color").val() || [];
  const tag = $("#tag").val();
  const product = $("#product").val();
  
  filteredCards = cardsData.filter(card => {
    // 逐個條件篩選
    const matchesKeyword = keyword ? card.name.toLowerCase().includes(keyword.toLowerCase()) : true;
    const matchesType = type === "allOption" || card.type === type;
    const matchesBloom = bloom ? card.bloom && card.bloom.includes(bloom) : true;
    const matchesColor = colors.length === 0 || colors.some(color => card.color && card.color.split(' / ').includes(color));
    const matchesTag = tag ? card.tag && card.tag.split(' / ').includes(tag) : true;
    const matchesProduct = product ? (card.product && Array.isArray(card.product) ? card.product.some(p => p.includes(product)) : card.product.includes(product)) : true;

    return matchesKeyword && matchesType && matchesBloom && matchesColor && matchesTag && matchesProduct;  // 返回符合所有條件的卡牌
  });  
  currentPage = 0;
  displayCards(filteredCards);
}

// 顯示卡牌的詳細資訊
function showPopup(card, index) {
  enableModalOpen();  // 禁用背景滾動
  
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

  // 收錄商品 名稱調整
  const cardProducts = Array.isArray(card.product) ? card.product : [card.product];  // 確保 card.product 是數組
  const productItems = cardProducts.map(productItem => {
    const setName = productItem.replace(/\(.*\)/, "").trim();  // 去掉括號及其中內容
    return setName;
  });

  // 將 \n 轉換為 <br>，將 \n\n 轉換為 <br><br>
  function formatTextWithLineBreaks(text) {
    return text ? text.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>") : "";
  }
  // 轉換聯動
  const effectCEffect = card.effectC ? formatTextWithLineBreaks(card.effectC.effect) : "";
  // 轉換綻放
  const effectBEffect = card.effectB ? formatTextWithLineBreaks(card.effectB.effect) : "";
  // 轉換天賦
  const effectGEffect = card.effectG ? formatTextWithLineBreaks(card.effectG.effect) : "";
  // 轉換 art1 效果
  const art1Effect = card.art1 ? formatTextWithLineBreaks(card.art1.effect) : "";
  // 轉換 art2 效果
  const art2Effect = card.art2 ? formatTextWithLineBreaks(card.art2.effect) : "";
  // 轉換支援卡效果
  const supportEffect = formatTextWithLineBreaks(card.supportEffect);
  // 轉換吶喊卡效果
  const yellEffect = formatTextWithLineBreaks(card.yellEffect);

  // 填充右側詳細資料
  let rightHtml = `
    <h2>${card.name}</h2>
  `;

  if (card.type === "主推") {
    rightHtml += `
      <div id="popupOshi">
        <div class="info">
          <span class="label">類型</span>
          <span>${card.type}</span>
        </div>
        
        <div class="info">
          <span class="label">收錄商品</span>
          <span>${productItems.join('<br>')}</span>
        </div>
        
        <div class="info">
          <span class="label">顏色</span>
          <span>${card.color}</span>
        </div>
        
        <div class="info">
          <span class="label">生命值</span>
          <span>${card.life}</span>
        </div>

        <div class="oshi-skill">
          <p class="label oshiSkill">主推技能</p>
          <p>[holo能量：${card.oshiSkill.holoPower}]<span>${card.oshiSkill.name}</span>${card.oshiSkill.effect}</p>
        </div>

        <div class ="sp-skill">
          <p class="label spSkill">SP主推技能</p>
          <p>[holo能量：${card.spSkill.holoPower}]<span>${card.spSkill.name}</span>${card.spSkill.effect}</p>
        </div>

        <div class="info">
          <span class="label">卡牌編號</span>
          <span>${card.id}</span>
        </div>
      </div>
    `;
  } else if (card.type === "成員") {
    rightHtml += `
      <div id="popupHolomen">
        <div class="info">
          <span class="label">類型</span>
          <span>${card.type}</span>
        </div>

        <div class="info">
          <span class="label">標籤</span>
          <span>${card.tag}</span>
        </div>
        
        <div class="info">
          <span class="label">收錄商品</span>
          <span>${productItems.join('<br>')}</span>
        </div>
        
        <div class="info">
          <span class="label">顏色</span>
          <span>${card.color}</span>
        </div>
        
        <div class="info">
          <span class="label">體力</span>
          <span>${card.hp}</span>
        </div>

        <div class="info">
          <span class="label">綻放等級</span>
          <span>${card.bloom}</span>
        </div>

        <div class="info">
          <span class="label">交棒</span>
          ${card.batonImage.length > 0
            ? card.batonImage.map((image, index) => `
              <img id="popupBatonImage${index + 1}" src="${image}" alt="Baton Image ${index + 1}" style="width: 28px; height: auto; object-fit: contain;">
            `).join('')
          : ''}
        </div>

        ${card.effectC ? `
          <div class="effect-C">
            <p class="label collab">聯動</p>
            <p>${card.effectC.name}<span>${effectCEffect}</span></p>
          </div>
        ` : ''}

        ${card.effectB ? `
          <div class="effect-B">
            <p class="label bloom">綻放</p>
            <p>${card.effectB.name}<span>${effectBEffect}</span></p>
          </div>
        ` : ''}

        ${card.effectG ? `
          <div class="effect-G">
            <p class="label gift">天賦</p>
            <p>${card.effectG.name}<span>${effectGEffect}</span></p>
          </div>
        ` : ''}

        ${card.art1 ? `
          <div class="art">
            <span class="label art">藝能</span>
            <div class="art-content">
              <div class="art-up">
                ${card.art1.image.length > 0
                  ? card.art1.image.slice(0, 4).map((img, index) => `
                    <span style="display: inline-flex; object-fit: contain;">
                      <img src="${img}" alt="Skill Image ${index + 1}" style="width: 28px; height: auto; object-fit: contain;">
                    </span>
                  `).join('')
                : ''}
                
                <div class="art-text">
                  <span class="text">${card.art1.name}</span>
                  <span class="text">${card.art1.damage}</span>
                </div>
                
                ${card.art1.specialAttackImage ? `
                  <div class="special-attack">
                    <img src="${card.art1.specialAttackImage}" alt="Special Attack" style="width: 60px; object-fit: contain;">
                  </div>
                ` : ''}
              </div>
              
              ${card.art1.effect ? `
                <div class="art-down">
                  <span class="art-effect">${art1Effect}</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${card.art2 ? `
          <div class="art">
            <span class="label art">藝能</span>
            <div class="art-content">
              <div class="art-up">
                ${card.art2.image.length > 0
                  ? card.art2.image.slice(0, 4).map((img, index) => `
                    <span style="display: inline-flex; object-fit: contain;">
                      <img src="${img}" alt="Skill Image ${index + 1}" style="width: 28px; height: auto; object-fit: contain;">
                    </span>
                  `).join('')
                : ''}
                
                <div class="art-text">
                  <span class="text">${card.art2.name}</span>
                  <span class="text">${card.art2.damage}</span>
                </div>
                
                ${card.art2.specialAttackImage ? `
                  <div class="special-attack">
                    <img src="${card.art2.specialAttackImage}" alt="Special Attack" style="width: 60px; object-fit: contain;">
                  </div>
                ` : ''}
              </div>
              
              ${card.art2.effect ? `
                <div class="art-down">
                  <span class="art-effect">${art2Effect}</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${card.extra ? `
          <div class="info">
            <span class="label extra">特殊規則</span>
            <span>${card.extra}</span>
          </div>
        ` : ''}

        <div class="info">
          <span class="label">卡牌編號</span>
          <span>${card.id}</span>
        </div>
      </div>
    `;
  } else if (card.type.includes("支援")) {
    rightHtml += `
      <div id="popupSupport">
        <div class="info">
          <span class="label">類型</span>
          <span>${card.type}</span>
        </div>

        ${card.tag ? `
          <div class="info">
            <span class="label">標籤</span>
            <span>${card.tag}</span>
          </div>
        ` : ''}

        <div class="${productItems.length === 1 ? 'info' : 'infoProducts'}">
          <span class="label">收錄商品</span>
          <span>${productItems.join('<br>')}</span>
        </div>

        <div class="infoSupport">
          <span class="label">效果</span>
          <span>${supportEffect}</span>
        </div>

        <div class="info">
          <span class="label">卡牌編號</span>
          <span>${card.id}</span>
        </div>
      </div>
    `;
  } else if (card.type === "吶喊") {
    rightHtml += `
      <div id="popupYell">
        <div class="info">
          <span class="label">類型</span>
          <span>${card.type}</span>
        </div>

        <div class="${productItems.length === 1 ? 'info' : 'infoProducts'}">
          <span class="label">收錄商品</span>
          <span>${productItems.join('<br>')}</span>
        </div>

        <div class="info">
          <span class="label">顏色</span>
          <span>${card.color}</span>
        </div>

        <div class="info">
          <span class="label">效果</span>
          <span>${yellEffect}</span>
        </div>

        <div class="info">
          <span class="label">卡牌編號</span>
          <span>${card.id}</span>
        </div>
      </div>
    `;
  }
  rightContent.innerHTML = rightHtml;
  document.getElementById('popup').style.display = 'flex';

  // 每次點擊彈窗回到最上方
  const popupInner = document.querySelector('.popup-inner');
  popupInner.scrollTop = 0;

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

// 統一管理 modal-open 的 padding-right
function enableModalOpen() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.classList.add("modal-open");
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}
function disableModalOpen() {
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = "";
}

// 關閉彈窗
document.getElementById('closePopup').addEventListener('click', function() {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
  disableModalOpen();  // 恢復背景滾動
});

// 點擊彈窗外部區域關閉彈窗
document.getElementById("popup").addEventListener("click", (e) => {
  if (e.target === document.getElementById("popup")) {
    document.getElementById("popup").style.display = "none";
    disableModalOpen();  // 恢復背景滾動
  }
});

// 小視窗隱藏篩選條件
function hideLeftSide() {
  leftSide.classList.remove('show');
  leftSide.style.pointerEvents = 'none';
  overlay.style.display = "none";
  disableModalOpen();

  setTimeout(() => {
    leftSide.style.visibility = 'hidden';
  }, 300);
}
// 小視窗顯示篩選條件
function showLeftSide() {
  leftSide.style.visibility = 'visible';
  leftSide.style.pointerEvents = 'auto';
  leftSide.classList.add('show');
  overlay.style.display = "block";
  enableModalOpen();
}
// 小視窗切回大視窗，清除篩選條件設定值、小視窗遮罩
function resetLeftSideForDesktop() {
  leftSide.classList.remove('show');
  leftSide.style.visibility = '';
  leftSide.style.pointerEvents = '';
  leftSide.style.transform = '';
  overlay.style.display = "none";
}

// 點擊小視窗篩選按鈕
filterBtn.addEventListener('click', () => {
  if (leftSide.classList.contains('show')) {
    hideLeftSide();
  } else {
    showLeftSide();
  }
});

// 禁止長按
document.addEventListener('contextmenu', function (e) {
  if (document.body.classList.contains("modal-open")) {
    e.preventDefault();
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

  if (window.innerWidth < 1024) {
    header.classList.remove('hidden');
    return;
  }

  if (currentScroll > lastScrollTop && currentScroll > hideThreshold) {
    header.classList.add('hidden');  // 滾動往下，隱藏 header
  } else {
    header.classList.remove('hidden');  // 滾動往上，顯示 header
  }

  // 更新滾動位置
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;  // 防止滾動過多
});
