const productForm = document.getElementById("productForm");
const sampleButton = document.getElementById("sampleButton");
const profileForm = document.getElementById("profileForm");
const profileSummary = document.getElementById("profileSummary");
const resultHighlight = document.getElementById("resultHighlight");
const resultReasons = document.getElementById("resultReasons");
const resultAction = document.getElementById("resultAction");
const resultNote = document.getElementById("resultNote");
const ingredientMatchList = document.getElementById("ingredientMatchList");
const historyList = document.getElementById("historyList");
const resultLoadingOverlay = document.getElementById("resultLoadingOverlay");
const assistantButtons = document.querySelectorAll(".assist-chip");
const assistantResponse = document.getElementById("assistantResponse");
const dashboardCards = document.querySelectorAll(".feature-card[data-panel]");
const quickCheckDashboardCard = document.querySelector('.feature-card[data-panel="quick-check"]');
const detailPanels = document.querySelectorAll(".detail-panel");
const profileNameInput = document.getElementById("profileName");
const conditionNoteInput = document.getElementById("conditionNote");
const saveProfileButton = document.getElementById("saveProfileButton");
const updateProfileButton = document.getElementById("updateProfileButton");
const deleteProfileButton = document.getElementById("deleteProfileButton");
const savedProfileList = document.getElementById("savedProfileList");
const cloudStatus = document.getElementById("cloudStatus");
const ledBorders = document.querySelectorAll(".led-border");
const startCameraButton = document.getElementById("startCameraButton");
const stopCameraButton = document.getElementById("stopCameraButton");
const capturePhotoButton = document.getElementById("capturePhotoButton");
const uploadPhotoButton = document.getElementById("uploadPhotoButton");
const scanImageInput = document.getElementById("scanImageInput");
const scannerVideo = document.getElementById("scannerVideo");
const scannerImagePreview = document.getElementById("scannerImagePreview");
const scannerPlaceholder = document.getElementById("scannerPlaceholder");
const scannerOcrOutput = document.getElementById("scannerOcrOutput");
const scannerExtractedText = document.getElementById("scannerExtractedText");
const useScannedTextButton = document.getElementById("useScannedTextButton");
const cameraStatus = document.getElementById("cameraStatus");
const menuToggle = document.getElementById("menuToggle");
const siteHeader = document.querySelector(".site-header");
const topNavLinks = document.querySelectorAll(".top-nav a");
const quickProfileSelect = document.getElementById("quickProfileSelect");
const cardDetailsSection = document.getElementById("card-details");
const dashboardSection = document.getElementById("dashboard");
const detailsScrollTopButton = document.getElementById("detailsScrollTopButton");
const languageSwitchButtons = document.querySelectorAll(".language-switch-button");
const mobileSectionToolbarTrack = document.getElementById("mobileSectionToolbarTrack");
const mobileNavToggle = document.getElementById("mobileNavToggle");
const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
const mobileMenuList = document.getElementById("mobileMenuList");
const backgroundMusicToggle = document.getElementById("backgroundMusicToggle");
const desktopCollapsibleCards = document.querySelectorAll(".feature-card[data-collapsible-desktop]");
const heroMascotMedia = document.querySelector(".hero-mascot-media");
const dashboardMascotMedia = document.querySelector(".dashboard-mascot-media");

function updateHeaderScrollState() {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

function isDesktopViewport() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function syncMascotPlayback() {
  const activeVideo = isDesktopViewport() ? dashboardMascotMedia : heroMascotMedia;
  const inactiveVideo = isDesktopViewport() ? heroMascotMedia : dashboardMascotMedia;

  inactiveVideo?.pause?.();

  if (!activeVideo) {
    return;
  }

  const playPromise = activeVideo.play?.();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function setDesktopCardCollapsedState(card, expanded) {
  if (!card) {
    return;
  }

  const toggle = card.querySelector(".feature-card-toggle");
  const content = card.querySelector(".feature-card-collapsible-content");
  if (!toggle || !content) {
    return;
  }

  const shouldExpand = !isDesktopViewport() ? true : expanded;
  card.classList.toggle("is-expanded", shouldExpand);
  card.classList.toggle("is-collapsed", !shouldExpand);
  toggle.setAttribute("aria-expanded", String(shouldExpand));
  content.setAttribute("aria-hidden", String(!shouldExpand));
  toggle.setAttribute(
    "aria-label",
    `${shouldExpand ? "Collapse" : "Expand"} ${card.querySelector("h3")?.textContent?.trim() || "card"}`
  );
}

function syncDesktopCollapsibleCards() {
  desktopCollapsibleCards.forEach((card) => {
    const shouldExpand = !isDesktopViewport() ? true : !card.classList.contains("is-collapsed");
    setDesktopCardCollapsedState(card, shouldExpand);
  });
}

function updateQuickCheckCardState() {
  if (!quickCheckDashboardCard) {
    return;
  }

  const hasSavedProfile = savedProfiles.length > 0;
  quickCheckDashboardCard.classList.toggle("is-profile-pending", !hasSavedProfile);
}

function scrollToQuickCheckCard() {
  if (isDesktopViewport() && quickCheckDashboardCard) {
    quickCheckDashboardCard.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  dashboardSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const ingredientLibrary = window.OLUSCAN_INGREDIENT_LIBRARY;
const externalProductAnalysisService = window.OluScanServices?.productAnalysisService || null;
const ocrScanService = window.OluScanServices?.ocrScanService || null;
const apiConfig = window.OLUSCAN_API_CONFIG || {};

const recentChecks = [];
const profileStorageKey = "oluscan-saved-profiles";
const profileSetupStorageKey = "oluscan-profile-setup-complete";
const languageStorageKey = "oluscan-language";
let savedProfiles = [];
let activeProfileId = null;
let cameraStream = null;
let analysisTimer = null;
let audioContext = null;
let ambientStarted = false;
let ambientOscillators = [];
let ambientGain = null;
let backgroundMusic = null;
let backgroundMusicStarted = false;
let backgroundMusicEnabled = false;
let backgroundMusicFadeTimer = null;
let audioUnlockBound = false;
let backgroundMusicAvailable = true;
let scannerPreviewUrl = null;
let lastScannedIngredientText = "";
const backgroundMusicTargetVolume = 0.2;
let currentLanguage = localStorage.getItem(languageStorageKey) || "en";
let lastRenderedAnalysis = null;
resultHighlight.dataset.state = "empty";

const translations = {
  en: {
    brandTagline: "Beauty-care product checker",
    navFunctions: "Functions",
    navDetails: "Details",
    heroEyebrow: "A Beauty-Tech Tool for Fast and Informed Skincare Decisions",
    heroTitleMain: "Understand a skincare product in seconds -",
    heroTitleHighlight: "before you decide to use",
    heroText: "Skincare ingredient lists are often difficult to understand, especially when users need to make quick decisions while shopping or visiting a salon. OluScan makes this easier by letting users scan or review ingredients and receive an instant, easy-to-read evaluation, so they can choose products more confidently.",
    designedFor: "Designed for",
    designedFor1: "Everyday skincare users",
    designedFor2: "Beauty shoppers",
    designedFor3: "Anyone who wants a quick and reliable way to understand product ingredients before purchasing",
    designedFor4: "Carefully select skincare gifts",
    designedForNote: "Friendly and readable flow.",
    cardProfileTitle: "Skin Profile",
    cardProfileDesc: "Store your skin type, sensitivity, and current skin conditions to support more accurate product evaluation and personalized results over time.",
    cardTagDry: "Dry",
    cardTagSensitive: "Sensitive",
    cardTagBarrier: "Barrier Support",
    cardScanTitle: "Scan or Enter Product",
    cardScanDesc: "Use your phone camera to scan product ingredients instantly, or enter them manually when scanning is not available. This helps you quickly access product information and start evaluating it right away.",
    cardScanHighlight: "Instant Product Check",
    cardScanSub: "Scan or type ingredients and get results in seconds.",
    cardAssistantTitle: "OluScan Assistant",
    cardAssistantDesc: "Ask questions and receive clear, easy-to-understand explanations about ingredients, product suitability, and skincare concerns. Designed to reduce confusion and support better decisions.",
    cardUxTitle: "UX and Layout Explanation",
    cardUxDesc: "Learn how the interface is designed to be simple, clear, and easy to use. This section explains the layout, user flow, and design decisions that help users interact quickly and confidently.",
    cardResultsTitle: "Analysis Results",
    cardResultsDesc: "View a clear breakdown of the product, including how suitable it is for your skin, key ingredient insights, and any potential concerns, all presented in a simple and easy-to-read format.",
    cardResultsLabel: "View Results",
    quickEyebrow: "Quick product check",
    quickTitle: "Enter product details in one clear card",
    scanEyebrow: "Mobile and tablet scan",
    scanTitle: "Use your device camera",
    cameraIdle: "Camera idle",
    cameraLive: "Camera live",
    cameraBlocked: "Camera blocked",
    cameraUnsupported: "Camera not supported",
    cameraBestOnMobile: "Best on mobile",
    scanPlaceholder: "Open the camera on a phone or tablet to scan a product label or ingredient list.",
    scanUnsupported: "This browser does not support direct camera access. Please use a modern mobile browser.",
    scanBlocked: "Allow camera access on your phone or tablet to scan the product label.",
    scanDesktopInfo: "On desktop, upload a product photo or enter ingredients manually. On phone and tablet, you can also use the camera.",
    startCamera: "Open Camera",
    stopCamera: "Stop Camera",
    takePhoto: "Take Photo",
    choosePhoto: "Choose Photo",
    scanProcessing: "Reading photo...",
    scanFilled: "Ingredients extracted from photo",
    scanAutoAnalyzing: "Photo scanned. Review the extracted text, then use it for analysis.",
    scanOcrUnsupported: "Text scan is not supported in this browser yet. Please use a newer Chrome or Edge on mobile/tablet.",
    scanNoText: "Could not find readable ingredient text in this photo. Try a clearer close-up of the ingredients list.",
    scanImageUnsupported: "This image format is not supported on this phone browser. Please choose a JPG or PNG image, or use Take Photo instead.",
    scannedProductName: "Scanned Product",
    scannedIngredientText: "Scanned ingredient text",
    useScannedText: "Use for Analysis",
    profileForCheck: "Skin profile for this check",
    useCurrentProfile: "Use current profile form",
    productName: "Product name",
    productNamePlaceholder: "Example: Daily Calm Toner",
    ingredientsLabel: "Ingredients",
    ingredientsPlaceholder: "Example: Water, Glycerin, Niacinamide, Fragrance",
    productType: "Product type",
    serum: "Serum",
    toner: "Toner",
    cleanser: "Cleanser",
    moisturizer: "Moisturizer",
    mask: "Mask",
    pharmaceuticals: "Pharmaceuticals",
    sunscreen: "Sunscreen",
    analyzeProduct: "Analyze Product",
    loadSampleData: "Load Sample Data",
    quickTip: "Quick tip",
    quickTipTitle: "Made for low-stress use",
    quickTipText: "Users only need the product name, ingredients, and type to get a fast prototype result.",
    profileEyebrow: "Skin profile",
    profileTitle: "Save and manage customer skin profiles",
    userAccount: "User Account",
    customerProfileStorage: "Customer profile storage",
    cloudReady: "Cloud sync ready",
    cloudUpdated: "Cloud sync updated",
    cloudLoaded: "Cloud profile loaded",
    cloudDeleted: "Profile deleted",
    profileName: "Profile name",
    profileNamePlaceholder: "Example: Anna - Dry Skin",
    skinType: "Skin type",
    oily: "Oily",
    combination: "Combination",
    normal: "Normal",
    focusConcerns: "Focus concerns",
    acneProne: "Acne-prone",
    redness: "Redness",
    fragranceSensitivity: "Fragrance sensitivity",
    weakSkinBarrier: "Weak skin barrier",
    dehydration: "Dehydration",
    currentSkinCondition: "Current skin condition",
    conditionPlaceholder: "Example: Skin feels more sensitive this week after trying a new toner.",
    saveNewProfile: "Save New Profile",
    updateSelectedProfile: "Update Selected Profile",
    currentProfile: "Current profile",
    noConditionNote: "No current skin-condition note saved.",
    noAddedConcerns: "no added concerns selected yet",
    deleteSelectedProfile: "Delete Selected Profile",
    savedProfiles: "Saved profiles",
    savedProfilesText: "More than one profile can be stored for the same user account.",
    noSavedProfiles: "No saved profiles yet.",
    noExtraConcerns: "No extra concerns",
    assistantPanelEyebrow: "Assistant panel",
    assistantPanelTitle: "Short help for uncertain moments",
    assistPatch: "When should I patch test?",
    assistFragrance: "What if my skin is sensitive?",
    assistStore: "How can I use this in a store?",
    assistPatchAnswer: "Patch test if a product contains fragrance, strong active ingredients, or if your skin reacts easily. Start with a small area before full use.",
    assistFragranceAnswer: "If your skin is sensitive, avoid heavily scented products when possible and choose simple formulas with barrier-supporting ingredients.",
    assistStoreAnswer: "In a store, use the quick check for a fast first decision. If the result shows caution, save the product and compare it later.",
    uxEyebrow: "UX and layout explanation",
    uxTitle: "Design logic in card form",
    ux1Title: "1. Clear first choice",
    ux1Text: "The card grid appears early so users immediately see the main actions without reading long instructions or opening menus.",
    ux2Title: "2. Short input flow",
    ux2Text: "The form asks only for product name, ingredients, and type. This keeps the experience realistic for users who are busy or in a public place.",
    ux3Title: "3. Lightweight profile",
    ux3Text: "The skin profile stays simple so the result feels more personal without becoming hard to use.",
    ux4Title: "4. Result hierarchy",
    ux4Text: "The decision appears first, then reasons and the next action, so users understand the outcome quickly.",
    ux5Title: "5. Whole-site guidance",
    ux5Text: "The website is organized as one presentation flow: users begin with the homepage card grid, open one function at a time, and then return to the grid when they want to switch tasks.",
    ux6Title: "6. Notes for users",
    ux6Text: "Users should start by setting a skin profile, then use Scan or Enter Product for ingredient checking. Large cards, short labels, language switching, camera support, and result cards are designed to reduce hesitation in real-world use.",
    ux7Title: "7. Notes for teachers",
    ux7Text: "This prototype includes several advanced UI elements for review: responsive card-grid navigation, saved multi-profile logic, mobile camera access, bilingual switching, animated floral layers, result loading states, and audio feedback for interaction and analysis outcomes.",
    ux8Title: "8. Complex UI review points",
    ux8Text: "Teachers can review how the system handles dynamic card resizing, hover animation, floating navigation, responsive mobile controls, and conditional result logic without changing the overall page structure. The goal is to show practical front-end thinking, not only visual styling.",
    resultsEyebrow: "Analysis result",
    resultsTitle: "Readable result cards",
    loadingEyebrow: "Analyzing product",
    loadingTitle: "OluScan is checking the ingredient list",
    loadingText: "Please wait while the prototype reviews known ingredients, profile concerns, and caution signals.",
    suitability: "Report results",
    waitingResult: "Waiting for a product check",
    waitingResultText: "Enter a product above to generate a quick and presentation-ready prototype result.",
    noResultYet: "No result yet",
    whyResult: "Why this result?",
    why1: "OluScan checks helpful, caution, and high-risk ingredients.",
    why2: "The result is adjusted using the selected skin profile.",
    why3: "The explanation is written in plain language for non-expert users.",
    recommendedAction: "Recommended action",
    resultActionDefault: "Run a quick check to see if the product looks suitable, needs caution, or may be better avoided.",
    note: "Note",
    resultNoteDefault: "This prototype gives guidance only and users should patch test or seek expert advice when unsure.",
    matchedIngredients: "Matched ingredients",
    matchedFallback: "Matched ingredient explanations will appear here after analysis.",
    recentChecks: "Recent checks",
    noRecentChecks: "No recent checks yet.",
    footerText1: "Front-end university prototype for simple beauty-care product suitability checks.",
    footerText2: "Designed for usability, responsiveness, and presentation clarity.",
    statusLooksSuitable: "Looks suitable",
    statusUseWithCare: "Use with care",
    statusNotYet: "Not yet able to analyze",
    statusShouldNot: "Should not be used",
    statusNotIdeal: "Not ideal for this profile",
    badgeSuitable: "Suitable",
    badgeCaution: "Caution",
    badgeLimited: "Limited",
    badgeAvoid: "Avoid"
  },
  vi: {
    brandTagline: "Công cụ kiểm tra sản phẩm chăm sóc da",
    navFunctions: "Chức năng",
    navDetails: "Chi tiết",
    heroEyebrow: "Công cụ beauty-tech hỗ trợ quyết định chăm sóc da nhanh và chính xác hơn",
    heroTitleMain: "Hiểu sản phẩm chăm sóc da chỉ trong vài giây -",
    heroTitleHighlight: "trước khi bạn quyết định sử dụng",
    heroText: "Bảng thành phần skincare thường khó hiểu, đặc biệt khi người dùng cần đưa ra quyết định nhanh lúc mua sắm hoặc ở spa, salon. OluScan giúp đơn giản hóa việc này bằng cách cho phép quét hoặc kiểm tra thành phần và trả về đánh giá rõ ràng, dễ đọc để người dùng tự tin hơn khi lựa chọn sản phẩm.",
    designedFor: "Phù hợp cho",
    designedFor1: "Người dùng skincare hằng ngày",
    designedFor2: "Người mua sắm mỹ phẩm",
    designedFor3: "Bất kỳ ai muốn hiểu nhanh thành phần sản phẩm trước khi mua",
    designedFor4: "Lựa chọn quà tặng skincare cẩn thận hơn",
    designedForNote: "Luồng sử dụng thân thiện và dễ đọc.",
    cardProfileTitle: "Hồ sơ da",
    cardProfileDesc: "Lưu loại da, độ nhạy cảm và tình trạng da hiện tại để hỗ trợ đánh giá sản phẩm chính xác hơn và cá nhân hóa kết quả theo thời gian.",
    cardTagDry: "Da khô",
    cardTagSensitive: "Nhạy cảm",
    cardTagBarrier: "Hỗ trợ hàng rào da",
    cardScanTitle: "Quét hoặc nhập sản phẩm",
    cardScanDesc: "Dùng camera điện thoại để quét nhanh thành phần sản phẩm, hoặc nhập thủ công khi không thể quét. Điều này giúp bạn truy cập thông tin sản phẩm và bắt đầu đánh giá ngay lập tức.",
    cardScanHighlight: "Kiểm tra sản phẩm tức thì",
    cardScanSub: "Quét hoặc nhập thành phần và nhận kết quả trong vài giây.",
    cardAssistantTitle: "Trợ lý OluScan",
    cardAssistantDesc: "Đặt câu hỏi và nhận giải thích rõ ràng, dễ hiểu về thành phần, độ phù hợp của sản phẩm và các vấn đề chăm sóc da. Được thiết kế để giảm bối rối và hỗ trợ quyết định tốt hơn.",
    cardUxTitle: "Giải thích UX và bố cục",
    cardUxDesc: "Tìm hiểu cách giao diện được thiết kế để đơn giản, rõ ràng và dễ dùng. Phần này giải thích bố cục, luồng người dùng và các quyết định thiết kế giúp người dùng thao tác nhanh và tự tin.",
    cardResultsTitle: "Kết quả phân tích",
    cardResultsDesc: "Xem bản phân tích rõ ràng của sản phẩm, gồm độ phù hợp với làn da, điểm nổi bật của thành phần và các lưu ý cần chú ý, tất cả được trình bày đơn giản, dễ đọc.",
    cardResultsLabel: "Xem kết quả",
    quickEyebrow: "Kiểm tra sản phẩm nhanh",
    quickTitle: "Nhập thông tin sản phẩm trong một thẻ rõ ràng",
    scanEyebrow: "Quét trên điện thoại và máy tính bảng",
    scanTitle: "Dùng camera thiết bị của bạn",
    cameraIdle: "Camera đang nghỉ",
    cameraLive: "Camera đang hoạt động",
    cameraBlocked: "Camera bị chặn",
    cameraUnsupported: "Không hỗ trợ camera",
    cameraBestOnMobile: "Tốt nhất trên di động",
    scanPlaceholder: "Mở camera trên điện thoại hoặc máy tính bảng để quét nhãn sản phẩm hoặc bảng thành phần.",
    scanUnsupported: "Trình duyệt này không hỗ trợ truy cập camera trực tiếp. Vui lòng dùng trình duyệt di động hiện đại hơn.",
    scanBlocked: "Hãy cho phép quyền truy cập camera trên điện thoại hoặc máy tính bảng để quét nhãn sản phẩm.",
    scanDesktopInfo: "Trên desktop, người dùng có thể tải ảnh sản phẩm lên hoặc nhập thành phần thủ công. Trên điện thoại và máy tính bảng, người dùng cũng có thể dùng camera.",
    startCamera: "Mở Camera",
    stopCamera: "Dừng Camera",
    profileForCheck: "Hồ sơ da dùng cho lần kiểm tra này",
    useCurrentProfile: "Dùng hồ sơ hiện tại trong biểu mẫu",
    productName: "Tên sản phẩm",
    productNamePlaceholder: "Ví dụ: Daily Calm Toner",
    ingredientsLabel: "Thành phần",
    ingredientsPlaceholder: "Ví dụ: Water, Glycerin, Niacinamide, Fragrance",
    productType: "Loại sản phẩm",
    serum: "Serum",
    toner: "Toner",
    cleanser: "Sữa rửa mặt",
    moisturizer: "Kem dưỡng",
    mask: "Mặt nạ",
    pharmaceuticals: "Dược mỹ phẩm",
    sunscreen: "Kem chống nắng",
    analyzeProduct: "Phân tích sản phẩm",
    loadSampleData: "Tải dữ liệu mẫu",
    quickTip: "Mẹo nhanh",
    quickTipTitle: "Thiết kế cho thao tác ít áp lực",
    quickTipText: "Người dùng chỉ cần tên sản phẩm, thành phần và loại sản phẩm để nhận kết quả prototype nhanh.",
    profileEyebrow: "Hồ sơ da",
    profileTitle: "Lưu và quản lý hồ sơ da của khách hàng",
    userAccount: "Tài khoản người dùng",
    customerProfileStorage: "Kho lưu hồ sơ khách hàng",
    cloudReady: "Sẵn sàng đồng bộ đám mây",
    cloudUpdated: "Đã cập nhật đồng bộ",
    cloudLoaded: "Đã tải hồ sơ từ bộ nhớ",
    cloudDeleted: "Đã xóa hồ sơ",
    profileName: "Tên hồ sơ",
    profileNamePlaceholder: "Ví dụ: Anna - Da khô",
    skinType: "Loại da",
    oily: "Da dầu",
    combination: "Da hỗn hợp",
    normal: "Da thường",
    focusConcerns: "Vấn đề cần quan tâm",
    acneProne: "Dễ nổi mụn",
    redness: "Đỏ da",
    fragranceSensitivity: "Nhạy cảm với hương liệu",
    weakSkinBarrier: "Hàng rào da yếu",
    dehydration: "Thiếu nước",
    currentSkinCondition: "Tình trạng da hiện tại",
    conditionPlaceholder: "Ví dụ: Da trở nên nhạy cảm hơn trong tuần này sau khi thử một loại toner mới.",
    saveNewProfile: "Lưu hồ sơ mới",
    updateSelectedProfile: "Cập nhật hồ sơ đã chọn",
    currentProfile: "Hồ sơ hiện tại",
    noConditionNote: "Chưa có ghi chú về tình trạng da hiện tại.",
    noAddedConcerns: "chưa chọn mối quan tâm bổ sung",
    deleteSelectedProfile: "Xóa hồ sơ đã chọn",
    savedProfiles: "Hồ sơ đã lưu",
    savedProfilesText: "Có thể lưu nhiều hơn một hồ sơ cho cùng một tài khoản người dùng.",
    noSavedProfiles: "Chưa có hồ sơ nào được lưu.",
    noExtraConcerns: "Không có mối quan tâm thêm",
    assistantPanelEyebrow: "Bảng trợ lý",
    assistantPanelTitle: "Hỗ trợ ngắn gọn trong những lúc phân vân",
    assistPatch: "Khi nào nên patch test?",
    assistFragrance: "Nếu da tôi nhạy cảm thì sao?",
    assistStore: "Tôi dùng công cụ này trong cửa hàng thế nào?",
    assistPatchAnswer: "Hãy patch test nếu sản phẩm có hương liệu, hoạt chất mạnh hoặc da bạn dễ phản ứng. Bắt đầu với một vùng nhỏ trước khi dùng toàn mặt.",
    assistFragranceAnswer: "Nếu da bạn nhạy cảm, hãy ưu tiên sản phẩm ít hương liệu và công thức đơn giản có thành phần hỗ trợ hàng rào da.",
    assistStoreAnswer: "Khi ở cửa hàng, hãy dùng kiểm tra nhanh để có quyết định ban đầu. Nếu kết quả báo cần cẩn trọng, hãy lưu sản phẩm lại và so sánh sau.",
    uxEyebrow: "Giải thích UX và bố cục",
    uxTitle: "Logic thiết kế dưới dạng thẻ",
    ux1Title: "1. Lựa chọn đầu tiên rõ ràng",
    ux1Text: "Lưới thẻ xuất hiện sớm để người dùng nhìn thấy ngay các hành động chính mà không cần đọc hướng dẫn dài hay mở menu.",
    ux2Title: "2. Luồng nhập ngắn gọn",
    ux2Text: "Biểu mẫu chỉ hỏi tên sản phẩm, thành phần và loại sản phẩm. Điều này giúp trải nghiệm thực tế hơn cho người dùng đang bận hoặc ở nơi công cộng.",
    ux3Title: "3. Hồ sơ gọn nhẹ",
    ux3Text: "Hồ sơ da được giữ đơn giản để kết quả có cảm giác cá nhân hơn nhưng vẫn dễ sử dụng.",
    ux4Title: "4. Thứ bậc kết quả",
    ux4Text: "Quyết định hiển thị trước, sau đó đến lý do và hành động tiếp theo, giúp người dùng hiểu kết quả nhanh hơn.",
    ux5Title: "5. Hướng dẫn toàn bộ website",
    ux5Text: "Website được tổ chức như một luồng trình bày thống nhất: người dùng bắt đầu từ lưới card ở trang chủ, mở từng chức năng một, rồi quay lại lưới khi muốn chuyển sang tác vụ khác.",
    ux6Title: "6. Ghi chú cho người dùng",
    ux6Text: "Người dùng nên bắt đầu bằng cách thiết lập hồ sơ da, sau đó dùng mục Quét hoặc nhập sản phẩm để kiểm tra thành phần. Các card lớn, nhãn ngắn, nút đổi ngôn ngữ, hỗ trợ camera và các thẻ kết quả được thiết kế để giảm do dự trong tình huống thực tế.",
    ux7Title: "7. Ghi chú cho giảng viên",
    ux7Text: "Prototype này có nhiều thành phần UI nâng cao để review: điều hướng card-grid responsive, logic lưu nhiều hồ sơ da, truy cập camera trên mobile, chuyển ngôn ngữ song ngữ, lớp hoa động, trạng thái loading kết quả và âm thanh phản hồi cho thao tác cũng như kết quả phân tích.",
    ux8Title: "8. Điểm review UI phức tạp",
    ux8Text: "Giảng viên có thể đánh giá cách hệ thống xử lý thay đổi kích thước card động, animation khi hover, điều hướng nổi, điều khiển mobile responsive và logic kết quả có điều kiện mà vẫn giữ nguyên cấu trúc trang tổng thể. Mục tiêu là thể hiện tư duy front-end thực tế, không chỉ là phần nhìn.",
    resultsEyebrow: "Kết quả phân tích",
    resultsTitle: "Các thẻ kết quả dễ đọc",
    loadingEyebrow: "Đang phân tích sản phẩm",
    loadingTitle: "OluScan đang kiểm tra bảng thành phần",
    loadingText: "Vui lòng chờ trong khi prototype rà soát các thành phần đã biết, mối quan tâm của hồ sơ da và các tín hiệu cần lưu ý.",
    suitability: "Kết quả báo cáo",
    waitingResult: "Đang chờ kiểm tra sản phẩm",
    waitingResultText: "Hãy nhập sản phẩm ở phía trên để tạo kết quả prototype nhanh và sẵn sàng cho thuyết trình.",
    noResultYet: "Chưa có kết quả",
    whyResult: "Vì sao ra kết quả này?",
    why1: "OluScan kiểm tra các thành phần hỗ trợ, cần cẩn trọng và rủi ro cao.",
    why2: "Kết quả được điều chỉnh theo hồ sơ da đã chọn.",
    why3: "Phần giải thích được viết bằng ngôn ngữ đơn giản cho người không chuyên.",
    recommendedAction: "Hành động đề xuất",
    resultActionDefault: "Hãy chạy kiểm tra nhanh để xem sản phẩm có vẻ phù hợp, cần cẩn trọng hay nên tránh dùng.",
    note: "Ghi chú",
    resultNoteDefault: "Prototype này chỉ mang tính hướng dẫn; người dùng nên patch test hoặc hỏi chuyên gia khi không chắc chắn.",
    matchedIngredients: "Thành phần đã nhận diện",
    matchedFallback: "Giải thích về các thành phần nhận diện được sẽ hiển thị ở đây sau khi phân tích.",
    recentChecks: "Lịch sử kiểm tra",
    noRecentChecks: "Chưa có lần kiểm tra nào gần đây.",
    footerText1: "Prototype đại học front-end cho việc kiểm tra nhanh độ phù hợp của sản phẩm chăm sóc da.",
    footerText2: "Thiết kế hướng tới khả năng sử dụng, responsive và rõ ràng khi thuyết trình.",
    statusLooksSuitable: "Có vẻ phù hợp",
    statusUseWithCare: "Cần sử dụng cẩn trọng",
    statusNotYet: "Chưa thể phân tích",
    statusShouldNot: "Không nên sử dụng",
    statusNotIdeal: "Chưa phù hợp với hồ sơ này",
    badgeSuitable: "Phù hợp",
    badgeCaution: "Cẩn trọng",
    badgeLimited: "Giới hạn",
    badgeAvoid: "Nên tránh"
  }
};

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

function getAssistantAnswers() {
  return {
    "patch-test": t("assistPatchAnswer"),
    fragrance: t("assistFragranceAnswer"),
    store: t("assistStoreAnswer")
  };
}

function localizeSkinType(value) {
  const map = {
    dry: t("cardTagDry"),
    oily: t("oily"),
    combination: t("combination"),
    sensitive: t("cardTagSensitive"),
    normal: t("normal")
  };

  return map[value] || capitalize(value);
}

function localizeSkinTypes(values) {
  const list = Array.isArray(values) ? values : [values].filter(Boolean);
  return list.map((value) => localizeSkinType(value)).join(", ");
}

function getPrimarySkinType(skinTypes) {
  const preferredOrder = ["sensitive", "combination", "oily", "dry", "normal"];
  const availableTypes = Array.isArray(skinTypes) ? skinTypes : [skinTypes].filter(Boolean);
  return preferredOrder.find((type) => availableTypes.includes(type)) || availableTypes[0] || "dry";
}

function localizeIngredientCategory(value) {
  if (currentLanguage !== "vi") {
    return capitalize(value);
  }

  const map = {
    base: "Nen",
    hydration: "Cap am",
    soothing: "Lam diu",
    barrier: "Ho tro hang rao da",
    antioxidant: "Chong oxy hoa",
    brightening: "Lam sang",
    active: "Hoat chat",
    "anti-ageing": "Chong lao hoa",
    peptide: "Peptide",
    sunscreen: "Chong nang",
    sensitivity: "Nhay cam",
    "fragrance-allergen": "Di ung huong lieu",
    preservative: "Bao quan",
    "preservative-support": "Ho tro bao quan",
    occlusive: "Khoa am",
    emollient: "Lam mem da",
    silicone: "Silicone",
    supporting: "Ho tro cong thuc",
    "ph-adjuster": "Dieu chinh pH",
    texture: "Ket cau",
    "amino-acid": "Amino acid",
    stabilizer: "On dinh cong thuc",
    emulsifier: "Nhu hoa",
    solubilizer: "Hoa tan",
    solvent: "Dung moi",
    "essential-oil": "Tinh dau",
    mineral: "Khoang chat",
    surfactant: "Chat lam sach",
    "botanical-extract": "Chiet xuat thuc vat",
    "marine-extract": "Chiet xuat bien",
    "astringent-botanical": "Thao moc lam san chac",
    ingredient: "Thanh phan"
  };

  return map[value] || capitalize(value);
}

function localizeIngredientExplanation(ingredient) {
  if (currentLanguage !== "vi") {
    return ingredient.explanation;
  }

  const map = {
    water: "Nuoc la thanh phan nen pho bien va thuong khong tu tao ra tin hieu rui ro cao cho da.",
    glycerin: "Glycerin la chat hut am giup hut nuoc va ho tro duong am cho da.",
    "butylene glycol": "Butylene glycol la chat hut am va dung moi pho bien trong cong thuc cham soc da.",
    "alcohol denat": "Mot so thanh phan goc con co the gay kho da hoac kich ung doi voi mot so loai da.",
    methylisothiazolinone: "Cac chat bao quan lien quan den methylisothiazolinone duoc xep vao nhom trung tinh trong prototype nay va khong tu dong bi xem la nguy hai cao.",
    "benzoic acid": "Benzoic acid va sodium benzoate duoc xem la chat bao quan thong dung va duoc xep vao nhom trung tinh trong prototype nay.",
    "sorbic acid": "Sorbic acid va potassium sorbate duoc xem la chat bao quan thong dung va duoc xep vao nhom trung tinh trong prototype nay.",
    formaldehyde: "Cac chat bao quan giai phong formaldehyde duoc xep vao nhom can than trong prototype nay, khong tu dong bi xem la nguy hai cao.",
    fragrance: "Huong lieu co the la tac nhan gay nhay cam doi voi mot so nguoi dung, dac biet la da de kich ung.",
    niacinamide: "Niacinamide thuong duoc su dung de ho tro hang rao da va cai thien tong the tinh trang da.",
    "hyaluronic acid": "Hyaluronic acid la thanh phan ho tro cap am va giu nuoc cho da.",
    panthenol: "Panthenol thuong duoc dung de lam diu va bo sung do am cho da.",
    "centella asiatica": "Centella asiatica thuong duoc su dung trong cac cong thuc lam diu va ho tro hang rao da.",
    "houttuynia cordata extract": "Houttuynia cordata extract la chiet xuat thuc vat thuong duoc dung trong cac cong thuc lam diu va ho tro dieu hoa da.",
    "2-hexanediol": "2-hexanediol thuong duoc dung nhu dung moi va thanh phan ho tro bao quan, nhin chung la trung tinh trong prototype nay.",
    "saccharum officinarum extract": "Sugar cane extract la thanh phan co nguon goc thuc vat thuong duoc dung de ho tro duong am va skin-conditioning.",
    "vitex agnus castus extract": "Vitex agnus castus extract la chiet xuat thuc vat mang tinh chat skin-conditioning va duoc xem la trung tinh trong prototype nay."
  };

  Object.assign(map, {
    "dimethyl sulfone": "Dimethyl sulfone, hay MSM, thuong xuat hien trong cac cong thuc ho tro da va duoc xem la thanh phan trung tinh trong prototype nay.",
    betaine: "Betaine thuong duoc su dung de ho tro cap am va giam cam giac kho da.",
    ceramide: "Ceramide giup ho tro hang rao da va thuong huu ich voi da kho hoac hang rao da yeu.",
    "aloe vera": "Aloe vera thuong duoc dung de lam diu va ho tro cap am cho da.",
    allantoin: "Allantoin thuong co mat trong cac cong thuc giup lam diu da.",
    urea: "Urea co the ho tro duong am va lam mem da, du mot so cong thuc manh van co the gay cham chich voi da dang kich ung.",
    squalane: "Squalane thuong duoc su dung de ho tro can bang do am va giam tinh trang kho da.",
    petrolatum: "Petrolatum la chat khoa am manh thuong duoc dung de giam mat nuoc qua da.",
    "shea butter": "Shea butter thuong duoc dung de lam mem da va ho tro hang rao bao ve da.",
    "colloidal oatmeal": "Colloidal oatmeal duoc dung rong rai trong cac san pham lam diu danh cho da kho hoac de kich ung.",
    "green tea": "Chiet xuat tra xanh thuong duoc dua vao cong thuc de ho tro chong oxy hoa va lam diu da.",
    "licorice root extract": "Cac dan xuat tu cam thao thuong duoc dung trong san pham lam sang va lam diu da.",
    "azelaic acid": "Azelaic acid thuong duoc dung trong routine huong toi mun va do da, co the huu ich neu da dung nap tot.",
    "tranexamic acid": "Tranexamic acid thuong xuat hien trong cong thuc huong toi da khong deu mau hoac vet tham sau mun.",
    "ascorbic acid": "Cac dang Vitamin C thuong duoc su dung de ho tro chong oxy hoa va lam sang da.",
    tocopherol: "Vitamin E thuong duoc dua vao cong thuc de ho tro chong oxy hoa va do on dinh san pham.",
    "polyquaternium-51": "Polyquaternium-51 thuong duoc su dung de ho tro giu am va cai thien cam giac tren da.",
    "snail secretion filtrate": "Dich loc oc sen thuong xuat hien trong cac cong thuc ho tro cap am va phuc hoi da.",
    "beta glucan": "Beta-glucan thuong duoc su dung de ho tro cap am va lam diu da.",
    "natto gum": "Natto gum xuat hien trong mot so cong thuc duong am va duoc xem la thanh phan ho tro trung tinh.",
    peptide: "Peptide thuong duoc su dung trong cac cong thuc chong lao hoa, nhung trong prototype nay khong duoc xem la tin hieu rui ro manh.",
    "copper tripeptide-1": "Copper tripeptide-1 la mot peptide thuong xuat hien trong cong thuc ho tro va phuc hoi da.",
    "zinc oxide": "Zinc oxide la bo loc UV vo co thuong co mat trong cac san pham chong nang.",
    "titanium dioxide": "Titanium dioxide la bo loc UV vo co pho bien trong cac san pham chong nang.",
    limonene: "Limonene la thanh phan lien quan toi huong lieu, co the can luu y hon voi da nhay cam hoac de di ung.",
    linalool: "Linalool la mot thanh phan huong lieu co the can luu y voi nguoi dung nhay cam voi mui huong.",
    citral: "Citral la thanh phan lien quan toi huong lieu va co the can nhac trong danh gia da nhay cam.",
    geraniol: "Geraniol la thanh phan huong lieu co the can luu y hon voi da de kich ung.",
    "benzyl alcohol": "Benzyl alcohol co the dong vai tro bao quan hoac huong lieu va co the gay kich ung voi mot so nguoi dung.",
    "witch hazel": "Witch hazel co the huu ich trong mot so cong thuc, nhung voi mot so loai da no co the gay kho hoac de kich ung.",
    menthol: "Menthol tao cam giac mat lanh, nhung cam giac nay co the khong de chiu voi da nhay cam.",
    camphor: "Camphor co the gay kich ung doi voi mot so nguoi dung va duoc xem la thanh phan can than trong prototype nay.",
    retinol: "Cac dan xuat retinoid co the huu ich, nhung thuong can dua vao routine mot cach tu tu va can than.",
    adapalene: "Adapalene la hoat chat manh va nen duoc dua vao routine mot cach can than.",
    tretinoin: "Tretinoin la hoat chat manh va duoc xem la thanh phan can su dung than trong trong prototype nay.",
    bakuchiol: "Bakuchiol thuong xuat hien trong cac cong thuc chong lao hoa diu hon va khong mac dinh duoc xem la nguy co cao.",
    "salicylic acid": "Salicylic acid la hoat chat manh co the huu ich cho da co mun, nhung neu dung qua muc co the qua suc voi mot so nguoi dung.",
    "glycolic acid": "Cac acid nhom AHA co the hieu qua nhung cung co the lam da nhay cam hon trong mot so routine.",
    "essential oil": "Tinh dau co the gay kich ung voi mot so nguoi dung, dac biet la da nhay cam.",
    "kojic acid": "Kojic acid co the huu ich trong cong thuc lam sang, nhung co the gay kich ung doi voi mot so nguoi dung.",
    arbutin: "Arbutin thuong duoc su dung trong cac san pham lam sang va khong mac dinh bi xem la nguy co cao trong prototype nay.",
    "propolis extract": "Propolis xuat hien trong mot so san pham lam diu, nhung khong phai ai cung phu hop nhu nhau.",
    "aloe barbadensis leaf extract": "Chiet xuat la lo hoi thuong duoc dung de lam diu va ho tro cap am.",
    "portulaca oleracea extract": "Portulaca oleracea extract thuong duoc dua vao cac cong thuc cham soc da huong toi lam diu.",
    "luffa cylindrica fruit/leaf/stem extract": "Chiet xuat thuc vat nay duoc xem la thanh phan ho tro trung tinh trong prototype hien tai.",
    "althaea rosea flower extract": "Cac chiet xuat hoa nhu althaea rosea duoc xem la nhom ho tro trung tinh trong prototype nay.",
    lanolin: "Lanolin huu ich voi mot so nguoi dung, nhung voi mot so truong hop nhay cam no co the khong ly tuong.",
    "coconut oil": "Dau dua khong mac dinh la khong phu hop, nhung cac loai dau dam hon co the khong tao cam giac ly tuong cho tat ca moi nguoi.",
    "jojoba oil": "Jojoba oil thuong xuat hien trong cong thuc lam mem da va duoc xem la trung tinh trong prototype nay.",
    "rosehip oil": "Rosehip oil thuong duoc su dung trong cac loai facial oil va khong mac dinh bi xem la co van de trong prototype nay.",
    "propylene glycol": "Propylene glycol la dung moi va chat hut am pho bien trong cong thuc cham soc da.",
    "lysine hcl": "Lysine HCl la thanh phan lien quan den amino acid va duoc xem la trung tinh trong prototype nay.",
    proline: "Proline la mot amino acid va duoc xem la thanh phan ho tro trung tinh.",
    "acetyl methionine": "Acetyl methionine duoc xem la thanh phan ho tro trung tinh trong library hien tai.",
    theanine: "Theanine duoc xem la thanh phan ho tro trung tinh trong prototype nay.",
    phenoxyethanol: "Phenoxyethanol la chat bao quan pho bien va khong mac dinh bi xem la khong an toan trong prototype nay.",
    paraben: "Paraben la chat bao quan va duoc xem la trung tinh trong prototype nay, tru khi nguoi dung da biet rang da minh phan ung voi no.",
    chlorphenesin: "Chlorphenesin la chat bao quan va khong bi mac dinh danh dau la nguy co trong prototype nay.",
    ethylhexylglycerin: "Ethylhexylglycerin thuong duoc dung de ho tro he bao quan va duoc xem la trung tinh trong prototype nay.",
    "benzoic acid": "Chat bao quan lien quan den benzoic acid co the can luu y hon voi nguoi dung co da rat de kich ung.",
    "sorbic acid": "Cac chat bao quan nhom sorbic acid thuong la thanh phan cong thuc thong thuong, nhung co the can than hon voi da nhay cam.",
    "benzoyl peroxide": "Benzoyl peroxide co the hieu qua voi mun nhung cung co the gay kho da hoac kich ung.",
    "myristic acid": "Myristic acid la mot fatty acid thuong duoc dung de ho tro he lam sach va bo bot, nhat la trong san pham rua troi.",
    "stearic acid": "Stearic acid la fatty acid pho bien giup ho tro ket cau, he lam sach va do on dinh cua cong thuc.",
    "lauric acid": "Lauric acid la fatty acid lam sach thuong co mat trong san pham tao bot, nhung cong thuc manh co the gay kho da o mot so nguoi dung.",
    "potassium hydroxide": "Potassium hydroxide thuong duoc dung de dieu chinh pH hoac ho tro tao he lam sach kieu xa phong, ban than no khong duoc xem la van de trong thanh pham hoan chinh.",
    "volcanic ash": "Volcanic ash thuong duoc dung nhu khoang chat hap phu va ho tro lam sach trong cac san pham rua troi.",
    "cocamide mea": "Cocamide MEA giup tang bot va do day cua sua rua mat, nhung he tao bot manh co the hoi nang voi da rat kho hoac de kich ung.",
    "glyceryl stearate": "Glyceryl stearate la thanh phan lam mem va nhu hoa pho bien, giup cong thuc muot va on dinh hon.",
    "disodium cocoamphodiacetate": "Disodium cocoamphodiacetate la surfactant lam sach va ho tro tao bot, thuong duoc xem la phan ho tro diu hon trong sua rua mat.",
    "olea europaea fruit oil": "Olive fruit oil la dau thuc vat lam mem da, co the giup da de chiu hon trong mot so cong thuc.",
    "peg-100 stearate": "PEG-100 stearate la thanh phan nhu hoa pho bien giup phoi hop pha dau va pha nuoc on dinh hon.",
    "polysorbate 20": "Polysorbate 20 thuong duoc su dung de giup huong lieu va mot so thanh phan duoc phan tan deu trong cong thuc.",
    "rose flower oil": "Rose flower oil chu yeu dong vai tro huong lieu va duoc xem la thanh phan can than trong voi nguoi dung nhay cam voi mui huong.",
    "rosmarinus officinalis leaf oil": "Rosemary leaf oil la dau thuc vat co mui huong, co the kem phu hop hon voi da rat de kich ung hoac nhay cam mui.",
    silica: "Silica la khoang chat hap phu giup cai thien ket cau, giam dinh va ho tro cam giac kho thoang tren da.",
    "sodium lauryl sulfate": "Sodium lauryl sulfate la surfactant tao bot va lam sach manh. Trong san pham rua troi no co the chap nhan duoc, nhung voi mot so nguoi dung no co the gay kho hoac kich ung.",
    "hexylene glycol": "Hexylene glycol la dung moi va thanh phan ho tro cong thuc, thuong khong bi xem la nguy co trong prototype nay."
  });

  return map[ingredient.key] || ingredient.explanation;
}

function applyStaticTranslations() {
  const setText = (selector, value) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.textContent = value;
    });
  };
  const setLabelText = (selector, value) => {
    const label = document.querySelector(selector);
    if (!label) {
      return;
    }
    const input = label.querySelector("input");
    if (!input) {
      label.textContent = value;
      return;
    }
    const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = ` ${value}`;
    } else {
      label.append(` ${value}`);
    }
  };

  setText(".brand-text span:last-child", t("brandTagline"));
  setText(".top-nav a:nth-child(1)", t("navFunctions"));
  setText(".top-nav a:nth-child(2)", t("navDetails"));
  setText(".hero-copy .eyebrow", t("heroEyebrow"));
  setText(".hero-brown", t("heroTitleMain"));
  setText(".hero-highlight", t("heroTitleHighlight"));
  setText(".hero-text", t("heroText"));
  setText(".hero-note-label", t("designedFor"));
  setText(".hero-note-list li:nth-child(1)", t("designedFor1"));
  setText(".hero-note-list li:nth-child(2)", t("designedFor2"));
  setText(".hero-note-list li:nth-child(3)", t("designedFor3"));
  setText(".hero-note-list li:nth-child(4)", t("designedFor4"));
  setText(".hero-note > span", t("designedForNote"));

  setText('.feature-card[data-panel="profile"] h3', t("cardProfileTitle"));
  setText('.feature-card[data-panel="profile"] p', t("cardProfileDesc"));
  setText('.feature-card[data-panel="profile"] .mini-tags span:nth-child(1)', t("cardTagDry"));
  setText('.feature-card[data-panel="profile"] .mini-tags span:nth-child(2)', t("cardTagSensitive"));
  setText('.feature-card[data-panel="profile"] .mini-tags span:nth-child(3)', t("cardTagBarrier"));
  setText('.feature-card[data-panel="quick-check"] h3', t("cardScanTitle"));
  setText('.feature-card[data-panel="quick-check"] p', t("cardScanDesc"));
  setText('.feature-card[data-panel="quick-check"] .card-stat strong', t("cardScanHighlight"));
  setText('.feature-card[data-panel="quick-check"] .card-stat span', t("cardScanSub"));
  setText('.feature-card[data-panel="assistant"] h3', t("cardAssistantTitle"));
  setText('.feature-card[data-panel="assistant"] p', t("cardAssistantDesc"));
  setText('.feature-card[data-panel="ux-logic"] h3', t("cardUxTitle"));
  setText('.feature-card[data-panel="ux-logic"] p', t("cardUxDesc"));
  setText('.feature-card[data-panel="results"] h3', t("cardResultsTitle"));
  setText('.feature-card[data-panel="results"] p', t("cardResultsDesc"));
  setText('.feature-card[data-panel="results"] .card-big-text', t("cardResultsLabel"));

  setText("#panel-quick-check .detail-head .eyebrow", t("quickEyebrow"));
  setText("#panel-quick-check .detail-head h2", t("quickTitle"));
  setText("#panel-quick-check .scanner-head .eyebrow", t("scanEyebrow"));
  setText("#panel-quick-check .scanner-head h3", t("scanTitle"));
  setText("#startCameraButton", t("startCamera"));
  setText("#stopCameraButton", t("stopCamera"));
  setText("#capturePhotoButton", t("takePhoto"));
  setText("#uploadPhotoButton", t("choosePhoto"));
  setText('label[for="scannerExtractedText"]', t("scannedIngredientText"));
  setText("#useScannedTextButton", t("useScannedText"));
  setText('label[for="quickProfileSelect"]', t("profileForCheck"));
  setText('label[for="productName"]', t("productName"));
  setText('label[for="ingredients"]', t("ingredientsLabel"));
  setText('label[for="productType"]', t("productType"));
  setText("#sampleButton", t("loadSampleData"));
  setText("#productForm .button-primary", t("analyzeProduct"));
  setText("#panel-quick-check .panel-side .eyebrow", t("quickTip"));
  setText("#panel-quick-check .panel-side h3", t("quickTipTitle"));
  setText("#panel-quick-check .panel-side .result-copy", t("quickTipText"));

  document.getElementById("productName")?.setAttribute("placeholder", t("productNamePlaceholder"));
  document.getElementById("ingredients")?.setAttribute("placeholder", t("ingredientsPlaceholder"));
  document.getElementById("productType").options[0].textContent = t("serum");
  document.getElementById("productType").options[1].textContent = t("toner");
  document.getElementById("productType").options[2].textContent = t("cleanser");
  document.getElementById("productType").options[3].textContent = t("moisturizer");
  document.getElementById("productType").options[4].textContent = t("mask");
  document.getElementById("productType").options[5].textContent = t("pharmaceuticals");
  document.getElementById("productType").options[6].textContent = t("sunscreen");

  setText("#panel-profile .detail-head .eyebrow", t("profileEyebrow"));
  setText("#panel-profile .detail-head h2", t("profileTitle"));
  setText(".account-summary .eyebrow", t("userAccount"));
  setText(".account-summary h3", t("customerProfileStorage"));
  setText('label[for="profileName"]', t("profileName"));
  document.getElementById("profileName")?.setAttribute("placeholder", t("profileNamePlaceholder"));
  setText("#profileForm legend", t("skinType"));
  setText('.choice-chips label:nth-child(1) span', t("cardTagDry"));
  setText('.choice-chips label:nth-child(2) span', t("oily"));
  setText('.choice-chips label:nth-child(3) span', t("combination"));
  setText('.choice-chips label:nth-child(4) span', t("cardTagSensitive"));
  setText('.choice-chips label:nth-child(5) span', t("normal"));
  setText("#profileForm fieldset:nth-of-type(2) legend", t("focusConcerns"));
  setLabelText('.toggle-list label:nth-child(1)', t("acneProne"));
  setLabelText('.toggle-list label:nth-child(2)', t("redness"));
  setLabelText('.toggle-list label:nth-child(3)', t("fragranceSensitivity"));
  setLabelText('.toggle-list label:nth-child(4)', t("weakSkinBarrier"));
  setLabelText('.toggle-list label:nth-child(5)', t("dehydration"));
  setText('label[for="conditionNote"]', t("currentSkinCondition"));
  document.getElementById("conditionNote")?.setAttribute("placeholder", t("conditionPlaceholder"));
  setText("#saveProfileButton", t("saveNewProfile"));
  setText("#updateProfileButton", t("updateSelectedProfile"));
  setText("#deleteProfileButton", t("deleteSelectedProfile"));
  setText(".saved-profiles-head h3", t("savedProfiles"));
  setText(".saved-profiles-head p", t("savedProfilesText"));

  setText("#panel-assistant .detail-head .eyebrow", t("assistantPanelEyebrow"));
  setText("#panel-assistant .detail-head h2", t("assistantPanelTitle"));
  setText('.assist-chip[data-help="patch-test"]', t("assistPatch"));
  setText('.assist-chip[data-help="fragrance"]', t("assistFragrance"));
  setText('.assist-chip[data-help="store"]', t("assistStore"));

  setText("#panel-ux-logic .detail-head .eyebrow", t("uxEyebrow"));
  setText("#panel-ux-logic .detail-head h2", t("uxTitle"));
  setText("#panel-ux-logic .ux-card:nth-child(1) h3", t("ux1Title"));
  setText("#panel-ux-logic .ux-card:nth-child(1) p", t("ux1Text"));
  setText("#panel-ux-logic .ux-card:nth-child(2) h3", t("ux2Title"));
  setText("#panel-ux-logic .ux-card:nth-child(2) p", t("ux2Text"));
  setText("#panel-ux-logic .ux-card:nth-child(3) h3", t("ux3Title"));
  setText("#panel-ux-logic .ux-card:nth-child(3) p", t("ux3Text"));
  setText("#panel-ux-logic .ux-card:nth-child(4) h3", t("ux4Title"));
  setText("#panel-ux-logic .ux-card:nth-child(4) p", t("ux4Text"));
  setText("#panel-ux-logic .ux-card:nth-child(5) h3", t("ux5Title"));
  setText("#panel-ux-logic .ux-card:nth-child(5) p", t("ux5Text"));
  setText("#panel-ux-logic .ux-card:nth-child(6) h3", t("ux6Title"));
  setText("#panel-ux-logic .ux-card:nth-child(6) p", t("ux6Text"));
  setText("#panel-ux-logic .ux-card:nth-child(7) h3", t("ux7Title"));
  setText("#panel-ux-logic .ux-card:nth-child(7) p", t("ux7Text"));
  setText("#panel-ux-logic .ux-card:nth-child(8) h3", t("ux8Title"));
  setText("#panel-ux-logic .ux-card:nth-child(8) p", t("ux8Text"));

  setText("#panel-results .detail-head .eyebrow", t("resultsEyebrow"));
  setText("#panel-results .detail-head h2", t("resultsTitle"));
  setText("#resultLoadingOverlay .eyebrow", t("loadingEyebrow"));
  setText("#resultLoadingOverlay h3", t("loadingTitle"));
  setText("#resultLoadingOverlay .result-copy", t("loadingText"));
  if (resultHighlight.dataset.state !== "loaded") {
    setText("#resultHighlight .result-label", t("suitability"));
    setText("#resultHighlight h3", t("waitingResult"));
    setText("#resultHighlight .result-copy", t("waitingResultText"));
    setText("#resultHighlight .badge", t("noResultYet"));
  }
  const whyTitle = resultReasons.closest(".result-card")?.querySelector("h3");
  if (whyTitle) whyTitle.textContent = t("whyResult");
  const actionTitle = resultAction.closest(".result-card")?.querySelector("h3");
  if (actionTitle) actionTitle.textContent = t("recommendedAction");
  const noteTitle = resultNote.closest(".result-card")?.querySelector("h3");
  if (noteTitle) noteTitle.textContent = t("note");
  const matchTitle = ingredientMatchList.closest(".result-card")?.querySelector("h3");
  if (matchTitle) matchTitle.textContent = t("matchedIngredients");
  const historyTitle = historyList.closest(".result-card")?.querySelector("h3");
  if (historyTitle) historyTitle.textContent = t("recentChecks");
  resultAction.textContent = t("resultActionDefault");
  resultNote.textContent = t("resultNoteDefault");
  if (!ingredientMatchList.children.length || ingredientMatchList.querySelector(".history-empty")) {
    ingredientMatchList.innerHTML = `<p class="history-empty">${t("matchedFallback")}</p>`;
  }
  if (!historyList.children.length || historyList.querySelector(".history-empty")) {
    historyList.innerHTML = `<p class="history-empty">${t("noRecentChecks")}</p>`;
  }
  resultReasons.innerHTML = `<li>${t("why1")}</li><li>${t("why2")}</li><li>${t("why3")}</li>`;

  setText(".footer-inner div p", t("footerText1"));
  setText(".footer-inner > p", t("footerText2"));
}

function applyLanguage(language) {
  currentLanguage = language;
  localStorage.setItem(languageStorageKey, language);
  document.documentElement.lang = language;
  languageSwitchButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === language);
  });
  applyStaticTranslations();
  updateProfileSummary();
  renderSavedProfiles();
  renderQuickProfileOptions();
  renderHistory();
  cloudStatus.textContent = t("cloudReady");
  cameraStatus.textContent = t("cameraIdle");
  scannerPlaceholder.textContent = isTouchDevice() ? t("scanPlaceholder") : t("scanDesktopInfo");
  assistantResponse.textContent = getAssistantAnswers()[document.querySelector(".assist-chip.active")?.dataset.help || "patch-test"];
  const mobileMenuTitle = document.querySelector(".mobile-menu-title");
  if (mobileMenuTitle) {
    mobileMenuTitle.textContent = t("navFunctions");
  }
  const mobileMenuItems = document.querySelectorAll(".mobile-menu-item:not(.mobile-menu-item--top)");
  mobileMenuItems.forEach((item, index) => {
    item.textContent = dashboardCards[index]?.querySelector("h3")?.textContent || item.textContent;
  });
  const mobileToolbarItems = document.querySelectorAll(".mobile-section-toolbar-item:not(.mobile-section-toolbar-item--top)");
  mobileToolbarItems.forEach((item, index) => {
    item.textContent = dashboardCards[index]?.querySelector("h3")?.textContent || item.textContent;
  });
  const topButton = document.querySelector(".mobile-menu-item--top");
  if (topButton) {
    topButton.textContent = currentLanguage === "vi" ? "Lên đầu trang" : "Scroll to Top";
  }

  const toolbarTopButton = document.querySelector(".mobile-section-toolbar-item--top");
  if (toolbarTopButton) {
    toolbarTopButton.textContent = currentLanguage === "vi" ? "LÃªn Ä‘áº§u trang" : "Scroll to Top";
  }

  const musicToggleLabel = backgroundMusicToggle?.querySelector(".background-music-toggle-text");
  if (musicToggleLabel) {
    musicToggleLabel.textContent = backgroundMusicEnabled
      ? (currentLanguage === "vi" ? "Nhạc bật" : "Sound On")
      : (currentLanguage === "vi" ? "Nhạc tắt" : "Sound Off");
  }
  if (backgroundMusicToggle) {
    backgroundMusicToggle.setAttribute(
      "aria-label",
      backgroundMusicEnabled
        ? (currentLanguage === "vi" ? "Tắt nhạc nền" : "Turn off background music")
        : (currentLanguage === "vi" ? "Bật nhạc nền" : "Turn on background music")
    );
  }

  if (resultHighlight.dataset.state === "loaded" && lastRenderedAnalysis?.matchedIngredients) {
    renderIngredientMatches(lastRenderedAnalysis.matchedIngredients);
  }

  if (typeof renderResultChatQuickQuestions === "function") {
    renderResultChatQuickQuestions();
  }
  if (typeof updateResultChatAvailability === "function") {
    updateResultChatAvailability();
  }

  requestAnimationFrame(() => {
    buildAllLedBorders();
  });
}

// Read the user's lightweight profile so the demo can personalize results.
function getProfileData() {
  const profileName = profileNameInput.value.trim() || "Untitled profile";
  const skinTypes = Array.from(profileForm.querySelectorAll('input[name="skinType"]:checked')).map((input) => input.value);
  const concerns = Array.from(profileForm.querySelectorAll('input[name="concern"]:checked')).map((input) => input.value);
  const conditionNote = conditionNoteInput.value.trim();
  const resolvedSkinTypes = skinTypes.length ? skinTypes : ["dry"];
  const skinType = getPrimarySkinType(resolvedSkinTypes);

  return { profileName, skinType, skinTypes: resolvedSkinTypes, concerns, conditionNote };
}

function updateProfileSummary() {
  const { profileName, skinTypes, concerns, conditionNote } = getProfileData();
  const concernMap = {
    acne: t("acneProne"),
    redness: t("redness"),
    fragrance: t("fragranceSensitivity"),
    barrier: t("weakSkinBarrier"),
    dehydration: t("dehydration")
  };
  const concernText = concerns.length ? concerns.map((concern) => concernMap[concern] || concern).join(", ") : t("noAddedConcerns");
  const conditionText = conditionNote || t("noConditionNote");
  const skinTypeText = localizeSkinTypes(skinTypes);
  const profileLine = currentLanguage === "vi"
    ? `${skinTypeText} voi ${concernText}.`
    : `${skinTypeText} skin profile with ${concernText}.`;

  profileSummary.innerHTML = `
    <h3>${t("currentProfile")}</h3>
    <p><strong>${profileName}</strong></p>
    <p>${profileLine}</p>
    <p>${conditionText}</p>
  `;
}
function getAnalysisProfile() {
  if (quickProfileSelect.value !== "current-form") {
    const selectedSavedProfile = savedProfiles.find((profile) => profile.id === quickProfileSelect.value);
    if (selectedSavedProfile) {
      return selectedSavedProfile;
    }
  }

  return getProfileData();
}

function loadSampleData() {
  document.getElementById("productName").value = "Anua Heartleaf 77% Soothing Toner";
  document.getElementById("ingredients").value = "Houttuynia Cordata Extract (77%), Water, 1,2-Hexanediol, Glycerin, Betaine, Panthenol, Saccharum Officinarum (Sugar Cane) Extract, Portulaca Oleracea Extract, Butylene Glycol, Vitex Agnus-Castus Extract, Chamomilla Recutita (Matricaria) Flower Extract, Arctium Lappa Root Extract, Phellinus Linteus Extract, Vitis Vinifera (Grape) Fruit Extract, Pyrus Malus (Apple) Fruit Extract, Centella Asiatica Extract, Isopentyldiol, Methylpropanediol, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Tromethamine, Disodium EDTA";
  document.getElementById("productType").value = "toner";
}

function normalizeIngredientName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitIngredientList(value) {
  return value
    .split(/,|\n|;/)
    .map((ingredient) => normalizeIngredientName(ingredient))
    .filter(Boolean);
}


function isMeaningfulPartialIngredientMatch(left, right) {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = normalizeIngredientName(left);
  const normalizedRight = normalizeIngredientName(right);
  const shortestLength = Math.min(normalizedLeft.length, normalizedRight.length);

  if (shortestLength < 4) {
    return false;
  }

  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}


function getSupplementaryIngredientEntry(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);
  const supplementaryEntries = [
    { key: "ethanol", category: "drying", effect: "caution", explanation: "Ethanol can feel drying or irritating for some users, especially sensitive skin." },
    { key: "isopropyl alcohol", category: "drying", effect: "caution", explanation: "Isopropyl alcohol can feel strong and may be irritating for sensitive skin." },
    { key: "cyclohexasiloxane", category: "silicone", effect: "neutral", explanation: "Cyclohexasiloxane is a silicone ingredient and is treated as safe in most routine formulas here." },
    { key: "amodimethicone", category: "silicone", effect: "neutral", explanation: "Amodimethicone is a silicone conditioning ingredient and is treated as safe in most routine formulas here." },
    { key: "sodium laureth sulfate", category: "surfactant", effect: "neutral", explanation: "Sodium laureth sulfate is treated as a routine cleanser surfactant rather than an automatic irritation flag here." },
    { key: "cocamidopropyl betaine", category: "surfactant", effect: "neutral", explanation: "Cocamidopropyl betaine is treated as a generally mild surfactant in this prototype." },
    { key: "decyl glucoside", category: "surfactant", effect: "neutral", explanation: "Decyl glucoside is treated as a generally mild surfactant in this prototype." },
    { key: "citric acid", category: "acid", effect: "caution", explanation: "Citric acid is generally routine, but it is treated as use-with-care for sensitive skin depending on concentration and formulation." },
    { key: "bht", category: "stabilizer", effect: "caution", explanation: "BHT is treated as use-with-care for sensitive skin in this prototype." },
    { key: "talc", category: "mineral", effect: "caution", explanation: "Talc is treated as use-with-care rather than automatically unsafe in this prototype." },
    { key: "eugenol", category: "fragrance-allergen", effect: "caution", explanation: "Eugenol is a fragrance-related component that may irritate sensitive skin." }
  ];

  const exactMatch = supplementaryEntries.find((entry) => entry.key === normalized);
  if (exactMatch) {
    return { ...exactMatch, aliases: [] };
  }

  if (/^peg(?:[\s\-/]*\d+)?/i.test(normalized)) {
    return {
      key: normalized,
      aliases: [],
      category: "emulsifier",
      effect: "neutral",
      explanation: "PEG-based ingredients are treated as safe routine formulation ingredients in this prototype unless another stronger signal is present."
    };
  }

  return null;
}

function findLibraryIngredient(ingredientName) {
  const libraryMatch = ingredientLibrary.ingredients.find((entry) => {
    if (entry.key === ingredientName || isMeaningfulPartialIngredientMatch(ingredientName, entry.key)) {
      return true;
    }

    return entry.aliases.some((alias) => alias === ingredientName || isMeaningfulPartialIngredientMatch(ingredientName, alias));
  });

  return libraryMatch || getSupplementaryIngredientEntry(ingredientName);
}

function ingredientTokenMatchesPattern(token, pattern) {
  const normalizedToken = normalizeIngredientName(token);
  const normalizedPattern = normalizeIngredientName(pattern);

  if (!normalizedToken || !normalizedPattern) {
    return false;
  }

  return normalizedToken === normalizedPattern || isMeaningfulPartialIngredientMatch(normalizedToken, normalizedPattern);
}

function productContainsIngredientPattern(ingredientTokens, recognizedIngredients, patterns) {
  return patterns.some((pattern) => {
    if (ingredientTokens.some((token) => ingredientTokenMatchesPattern(token, pattern))) {
      return true;
    }

    return recognizedIngredients.some((ingredient) => {
      if (ingredientTokenMatchesPattern(ingredient.key, pattern)) {
        return true;
      }

      return ingredient.aliases?.some((alias) => ingredientTokenMatchesPattern(alias, pattern));
    });
  });
}

function detectBeneficialCombos(ingredientTokens, recognizedIngredients) {
  const comboInsights = [];
  const patternAliases = {
    "green tea extract": ["green tea", "camellia sinensis leaf extract"],
    "fatty acids": ["fatty acid", "stearic acid", "palmitic acid", "oleic acid", "linoleic acid"],
    "oat extract": ["oat extract", "colloidal oatmeal", "avena sativa kernel flour", "oat kernel flour", "avena sativa"],
    "aloe vera": ["aloe vera", "aloe", "aloe barbadensis leaf juice", "aloe barbadensis leaf extract", "aloe leaf extract"],
    "zinc pca": ["zinc pca"],
    "hyaluronic acid": ["hyaluronic acid", "sodium hyaluronate"]
  };
  const comboRules = [
    {
      tag: "beneficial_combo_oily",
      label: "Good for oily skin",
      message: "These ingredients work well together to help control oil, unclog pores, and maintain skin balance.",
      combinations: [
        ["niacinamide", "salicylic acid"],
        ["niacinamide", "zinc pca"],
        ["salicylic acid", "hyaluronic acid"],
        ["glycolic acid", "panthenol"],
        ["niacinamide", "green tea extract"],
        ["zinc pca", "allantoin"]
      ]
    },
    {
      tag: "beneficial_combo_sensitive",
      label: "Good for sensitive skin",
      message: "These ingredients help soothe irritation, strengthen the skin barrier, and reduce sensitivity.",
      combinations: [
        ["ceramide", "cholesterol", "fatty acids"],
        ["centella asiatica", "panthenol"],
        ["aloe vera", "allantoin"],
        ["niacinamide", "ceramide"],
        ["oat extract", "panthenol"]
      ]
    }
  ];

  comboRules.forEach((rule) => {
    const matchedCombination = rule.combinations.find((combination) =>
      combination.every((pattern) => productContainsIngredientPattern(ingredientTokens, recognizedIngredients, patternAliases[pattern] || [pattern]))
    );

    if (!matchedCombination) {
      return;
    }

    comboInsights.push({
      tag: rule.tag,
      label: rule.label,
      message: rule.message,
      matchedCombination
    });
  });

  return comboInsights;
}

function detectRiskyCombos(ingredientTokens, recognizedIngredients) {
  const comboInsights = [];
  const patternAliases = {
    "aha/bha": ["glycolic acid", "lactic acid", "salicylic acid", "bha", "aha"],
    "fragrance or essential oil": [
      "fragrance",
      "parfum",
      "perfume",
      "limonene",
      "linalool",
      "lavender oil",
      "peppermint oil",
      "tea tree oil"
    ],
    "exfoliating acid": ["glycolic acid", "lactic acid", "salicylic acid", "bha", "aha"],
    "retinoid": ["retinol", "retinal", "retinyl palmitate", "tretinoin"],
    "methylisothiazolinone": ["methylisothiazolinone", "methylchloroisothiazolinone", "mi", "mci"],
    "fragrance": ["fragrance", "parfum", "perfume"],
    "alcohol denat": ["alcohol denat", "denatured alcohol"],
    "retinol": ["retinol", "retinyl palmitate"],
    "retinal": ["retinal"],
    "tretinoin": ["tretinoin"],
    "glycolic acid": ["glycolic acid", "aha"],
    "lactic acid": ["lactic acid", "aha"],
    "salicylic acid": ["salicylic acid", "bha"],
    "lavender oil": ["lavender oil", "lavandula angustifolia oil", "lavandula angustifolia (lavender) oil"],
    "peppermint oil": ["peppermint oil"],
    "tea tree oil": ["tea tree oil"]
  };
  const comboRules = [
    {
      tag: "risky_combo_exfoliation",
      label: "Irritation risk combo",
      message: "Multiple exfoliating acids are present. This may increase irritation risk, especially for sensitive or compromised skin.",
      combinations: [
        ["glycolic acid", "salicylic acid"],
        ["lactic acid", "salicylic acid"],
        ["glycolic acid", "lactic acid"]
      ]
    },
    {
      tag: "risky_combo_retinoid_exfoliant",
      label: "Potentially harsh combination",
      message: "Retinoids combined with exfoliating acids may increase irritation, dryness, and skin barrier stress.",
      combinations: [
        ["retinol", "glycolic acid"],
        ["retinol", "lactic acid"],
        ["retinol", "salicylic acid"],
        ["retinal", "glycolic acid"],
        ["retinal", "salicylic acid"],
        ["tretinoin", "aha/bha"]
      ]
    },
    {
      tag: "risky_combo_retinoid_fragrance",
      label: "Potentially harsh combination",
      message: "Retinoids combined with fragrance or essential oils may be more irritating for sensitive skin.",
      combinations: [
        ["retinol", "fragrance"],
        ["retinol", "parfum"],
        ["retinol", "limonene"],
        ["retinol", "linalool"],
        ["retinal", "fragrance"],
        ["tretinoin", "fragrance"],
        ["retinoid", "lavender oil"],
        ["retinoid", "peppermint oil"],
        ["retinoid", "tea tree oil"]
      ]
    },
    {
      tag: "risky_combo_acid_fragrance",
      label: "Barrier stress risk",
      message: "Exfoliating acids combined with fragrance or essential oils may increase sensitivity and irritation risk.",
      combinations: [
        ["glycolic acid", "fragrance"],
        ["lactic acid", "fragrance"],
        ["salicylic acid", "fragrance"],
        ["exfoliating acid", "lavender oil"],
        ["exfoliating acid", "peppermint oil"],
        ["exfoliating acid", "tea tree oil"]
      ]
    },
    {
      tag: "risky_combo_drying",
      label: "Potentially harsh combination",
      message: "This combination may feel too drying or harsh, especially if the skin barrier is weakened.",
      combinations: [
        ["salicylic acid", "alcohol denat"],
        ["glycolic acid", "alcohol denat"],
        ["retinol", "alcohol denat"],
        ["isopropyl alcohol", "exfoliating acid"]
      ]
    },
    {
      tag: "risky_combo_sensitive_trigger",
      label: "Irritation risk combo",
      message: "This combination may increase irritation potential for highly sensitive skin.",
      combinations: [
        ["methylisothiazolinone", "fragrance"],
        ["phenoxyethanol", "fragrance"]
      ]
    }
  ];

  comboRules.forEach((rule) => {
    const matchedCombination = rule.combinations.find((combination) =>
      combination.every((pattern) => productContainsIngredientPattern(ingredientTokens, recognizedIngredients, patternAliases[pattern] || [pattern]))
    );

    if (!matchedCombination) {
      return;
    }

    comboInsights.push({
      tag: rule.tag,
      label: rule.label,
      message: rule.message,
      matchedCombination
    });
  });

  return comboInsights;
}


function isComplexIngredientToken(ingredientName) {
  if (ingredientName.length > 22) {
    return true;
  }

  return ingredientLibrary.complexMarkers.some((marker) => ingredientName.includes(marker));
}

function analyzeProduct(formData, profile) {
  const ingredientTokens = splitIngredientList(formData.ingredients);
  const reasons = [];
  const comboTags = [];
  let status = "Looks suitable";
  let badgeClass = "badge-safe";
  let badgeText = "Suitable";
  let actionText = "This formula appears friendly for everyday use. Introduce it normally and monitor how your skin feels.";
  let noteText = "Prototype note: This result is guidance only. Patch testing or expert advice is recommended when users are unsure.";
  let suitabilityScore = 100;

  const recognizedIngredients = [];
  const unknownIngredients = [];
  const supportHits = [];
  const cautionHits = [];
  const avoidHits = [];
  const complexTokens = [];

  ingredientTokens.forEach((token) => {
    const matchedIngredient = findLibraryIngredient(token);
    if (!matchedIngredient) {
      unknownIngredients.push(token);
      if (isComplexIngredientToken(token)) {
        complexTokens.push(token);
      }
      return;
    }

    recognizedIngredients.push(matchedIngredient);

    if (matchedIngredient.effect === "support") {
      supportHits.push(matchedIngredient);
    } else if (matchedIngredient.effect === "caution") {
      cautionHits.push(matchedIngredient);
    } else if (matchedIngredient.effect === "avoid") {
      avoidHits.push(matchedIngredient);
    }
  });

  const unknownRatio = ingredientTokens.length ? unknownIngredients.length / ingredientTokens.length : 1;
  const recognizedRatio = ingredientTokens.length ? recognizedIngredients.length / ingredientTokens.length : 0;
  const tooComplex =
    ingredientTokens.length >= ingredientLibrary.complexityThresholds.longFormulaCount &&
    unknownRatio >= ingredientLibrary.complexityThresholds.maxRecognizableUnknownRatio &&
    recognizedIngredients.length < 5;
  const tooTechnical = complexTokens.length >= ingredientLibrary.complexityThresholds.complexTokenCount && recognizedRatio < 0.35;

  if (tooComplex || tooTechnical) {
    return {
      status: "Not yet able to analyze",
      suitabilityScore: 35,
      badgeClass: "badge-neutral",
      badgeText: "Limited",
      actionText: "This ingredient list is currently too complex for the prototype library. Please compare with another source or ask a skincare professional.",
      noteText: "Warning: When a formula is too technical or contains many unrecognized components, OluScan will avoid giving a risky answer.",
      reasons: [
        "The formula contains many ingredients that are not yet covered by the current OluScan ingredient library.",
        "Several components look highly technical or difficult to classify safely in this front-end prototype."
      ],
      matchedIngredients: [],
      comboTags
    };
  }

  if (supportHits.length) {
    suitabilityScore += supportHits.length * 7;
    reasons.push(`Helpful ingredients found: ${supportHits.map((item) => item.key).join(", ")}.`);
  }

  if (cautionHits.length) {
    suitabilityScore -= cautionHits.length * 12;
    reasons.push(`Use-with-care ingredients found: ${cautionHits.map((item) => item.key).join(", ")}.`);
    status = "Use with care";
    badgeClass = "badge-warn";
    badgeText = "Caution";
    actionText = "Patch test first and introduce the product carefully, especially if the user's skin is reactive.";
    noteText = "Note: Active or sensitivity-trigger ingredients may still be useful, but they should be introduced carefully.";
  }

  if (avoidHits.length) {
    suitabilityScore -= avoidHits.length * 24;
    reasons.push(`High-risk ingredients found: ${avoidHits.map((item) => item.key).join(", ")}.`);
    status = "Should not be used";
    badgeClass = "badge-danger";
    badgeText = "Avoid";
    actionText = "This product is not recommended in the current prototype analysis. A gentler alternative is safer.";
    noteText = "Warning: This result includes ingredients that OluScan treats as unsafe or too high-risk for normal use.";
  }

  if (profile.concerns.includes("fragrance") && cautionHits.some((item) => item.key === "fragrance")) {
    suitabilityScore -= 12;
    reasons.push("The selected skin profile includes fragrance sensitivity and the product contains fragrance.");
    status = avoidHits.length ? status : "Not ideal for this profile";
    badgeClass = avoidHits.length ? "badge-danger" : "badge-warn";
    badgeText = avoidHits.length ? "Avoid" : "Caution";
    actionText = "Because the selected profile includes fragrance sensitivity, a fragrance-free alternative is safer.";
    noteText = "Warning: Personal skin concerns can change a formula from acceptable to unsuitable for a specific user.";
  }

  if ((profile.skinTypes || [profile.skinType]).includes("sensitive") && cautionHits.length) {
    suitabilityScore -= 10;
    reasons.push("Sensitive skin type selected, so active or irritation-prone ingredients matter more.");
  }

  if ((profile.skinTypes || [profile.skinType]).includes("normal") && status === "Looks suitable") {
    if (supportHits.length) {
      suitabilityScore += 5;
      actionText = "This product will help improve your skin.";
      reasons.push("Normal skin selected and the formula includes supportive ingredients that may improve skin comfort and condition.");
    } else {
      actionText = "Normal when used.";
      reasons.push("Normal skin selected and no major caution signal was found, but the formula does not strongly stand out as especially beneficial.");
    }
  }

  if (!reasons.length && recognizedIngredients.length) {
    reasons.push("Recognized ingredients in this formula do not show a major caution signal in the current OluScan library.");
  }

  if (!recognizedIngredients.length) {
    return {
      status: "Not yet able to analyze",
      suitabilityScore: 28,
      badgeClass: "badge-neutral",
      badgeText: "Limited",
      actionText: "The current library could not confidently classify this ingredient list. Please use another trusted source.",
      noteText: "Warning: OluScan should not guess when ingredient recognition is too limited.",
      reasons: [
        "The formula does not contain enough ingredients recognized by the current internal library.",
        "A safer response is to avoid overconfident analysis."
      ],
      matchedIngredients: [],
      comboTags
    };
  }

  const comboInsights = detectBeneficialCombos(ingredientTokens, recognizedIngredients);
  comboInsights.forEach((combo) => {
    comboTags.push(combo.tag);
    reasons.push(`${combo.label}: ${combo.message}`);
  });

  const riskyComboInsights = detectRiskyCombos(ingredientTokens, recognizedIngredients);
  riskyComboInsights.forEach((combo) => {
    comboTags.push(combo.tag);
    reasons.push(`${combo.label}: ${combo.message}`);
  });

  const matchedIngredients = recognizedIngredients
    .filter((ingredient, index, list) => list.findIndex((item) => item.key === ingredient.key) === index)
    .slice(0, 8);

  if (unknownIngredients.length && unknownRatio < 0.65) {
    suitabilityScore -= Math.min(unknownIngredients.length * 2, 10);
    reasons.push(`Some ingredients are still not covered in the current library: ${unknownIngredients.slice(0, 4).join(", ")}${unknownIngredients.length > 4 ? ", and more" : ""}.`);
  }

  suitabilityScore = Math.max(0, Math.min(100, Math.round(suitabilityScore)));

  if (status !== "Not yet able to analyze") {
    if (suitabilityScore <= 40) {
      status = "Should not be used";
      badgeClass = "badge-danger";
      badgeText = "Avoid";
    } else if (suitabilityScore <= 70 && status === "Looks suitable") {
      status = "Use with care";
      badgeClass = "badge-warn";
      badgeText = "Caution";
    }
  }

  return { status, suitabilityScore, badgeClass, badgeText, actionText, noteText, reasons, matchedIngredients, comboTags };
}

function mergeMatchedIngredients(baseMatches, enrichedIngredients) {
  const baseList = Array.isArray(baseMatches) ? baseMatches : [];
  const extraList = Array.isArray(enrichedIngredients) ? enrichedIngredients : [];
  const merged = [...baseList];

  extraList.forEach((item) => {
    const key = item.ingredientName || item.key;
    if (!key) {
      return;
    }

    const alreadyExists = merged.some((entry) => entry.key === key);
    if (alreadyExists) {
      return;
    }

    merged.push({
      key,
      category: item.functions?.[0] || "ingredient",
      explanation: item.explanation || ""
    });
  });

  return merged.slice(0, 8);
}

// Keep the existing UI result model, but allow external data to enrich it safely.
function mergeAnalysisWithExternalData(baseAnalysis, externalContext) {
  if (!externalContext) {
    return baseAnalysis;
  }

  const mergedComboTags = [
    ...(Array.isArray(baseAnalysis.comboTags) ? baseAnalysis.comboTags : []),
    ...(Array.isArray(externalContext.summary?.comboTags) ? externalContext.summary.comboTags : [])
  ].filter((tag, index, list) => tag && list.indexOf(tag) === index);

  const mergedAnalysis = {
    ...baseAnalysis,
    reasons: [...(baseAnalysis.reasons || [])],
    matchedIngredients: mergeMatchedIngredients(baseAnalysis.matchedIngredients, externalContext.enrichedIngredients),
    sources: externalContext.summary?.sources || [],
    historyMeta: externalContext.summary?.historyMeta || {},
    comboTags: mergedComboTags
  };

  if (externalContext.product?.source) {
    mergedAnalysis.reasons.unshift("External product data was checked to support this ingredient review.");
  }

  if (Array.isArray(externalContext.summary?.reasons)) {
    externalContext.summary.reasons.forEach((reason) => {
      if (reason && !mergedAnalysis.reasons.includes(reason)) {
        mergedAnalysis.reasons.push(reason);
      }
    });
  }

  if (
    externalContext.summary?.cautionIngredients?.length &&
    !mergedAnalysis.reasons.some((reason) => reason.includes("Extra caution from enriched ingredient data"))
  ) {
    const cautionNames = externalContext.summary.cautionIngredients
      .slice(0, 3)
      .map((item) => item.ingredientName)
      .join(", ");
    mergedAnalysis.reasons.push(`Extra caution from enriched ingredient data: ${cautionNames}.`);
  }

  if (externalContext.summary?.analysisNote && !mergedAnalysis.noteText.includes(externalContext.summary.analysisNote)) {
    mergedAnalysis.noteText = `${mergedAnalysis.noteText} ${externalContext.summary.analysisNote}`.trim();
  }

  if (externalContext.summary?.recommendedActions?.length && mergedAnalysis.actionText) {
    const aiAction = externalContext.summary.recommendedActions[0];
    if (aiAction && !mergedAnalysis.actionText.includes(aiAction)) {
      mergedAnalysis.actionText = `${mergedAnalysis.actionText} ${aiAction}`.trim();
    }
  }

  return mergedAnalysis;
}

function getAnalysisSourceMode(analysis) {
  const sources = Array.isArray(analysis?.sources) ? analysis.sources : [];
  const hasExternalProduct = sources.some((item) => item.source === "openBeautyFacts" || item.source === "openBeautyFactsSearch");
  const hasEnrichment = sources.some((item) => item.type === "ingredient-enrichment");
  const hasOpenAiAnalysis = sources.some((item) => item.type === "ai-ingredient-analysis");
  if (hasExternalProduct && (hasEnrichment || hasOpenAiAnalysis)) {
    return "external+fallback";
  }
  if (hasExternalProduct) {
    return "external";
  }
  if (hasEnrichment || hasOpenAiAnalysis) {
    return "fallback-enriched";
  }
  return "local-only";
}
function traceAnalysisDebug(payload) {
  if (!apiConfig?.debug?.enableConsoleTracing) {
    return;
  }
  console.info("[OluScan Debug] Analysis pipeline", payload);
}

function getIngredientGoogleLink(ingredientName) {
  const visibleName = String(ingredientName || "").trim().replace(/\s+/g, " ");
  const query = encodeURIComponent(`${visibleName} skincare ingredient definition`);
  return `https://www.google.com/search?q=${query}`;
}

function getIngredientLinkHtml(ingredientName, variant = "") {
  const visibleName = String(ingredientName || "").trim();
  const variantClass = variant ? ` ingredient-link--${variant}` : "";
  return `
    <a
      class="ingredient-link${variantClass}"
      href="${getIngredientGoogleLink(visibleName)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Google definition for ${capitalize(visibleName)}"
    >${capitalize(visibleName)}</a>
  `;
}

function formatReasonText(reason) {
  const linkedPrefixes = [
    { prefix: "Helpful ingredients found:", variant: "support", warning: false },
    { prefix: "Use-with-care ingredients found:", variant: "warn", warning: false },
    { prefix: "High-risk ingredients found:", variant: "danger", warning: true },
    { prefix: "Some ingredients are still not covered in the current library:", variant: "neutral", warning: false }
  ];

  const matchedRule = linkedPrefixes.find(({ prefix }) => reason.startsWith(prefix));
  if (!matchedRule) {
    return reason;
  }

  const ingredientText = reason.slice(matchedRule.prefix.length).trim().replace(/\.$/, "");
  const normalizedText = ingredientText.replace(", and more", "");
  const ingredientNames = normalizedText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const linkedNames = ingredientNames.map((ingredientName) => getIngredientLinkHtml(ingredientName, matchedRule.variant)).join(", ");
  const suffix = ingredientText.includes(", and more") ? ", and more" : "";
  const labelClass = matchedRule.warning ? "result-reason-label result-reason-label-danger" : "result-reason-label";
  const icon = matchedRule.warning ? '<span class="result-warning-icon" aria-hidden="true">&#9650;</span>' : "";

  return `<span class="${labelClass}">${icon}${matchedRule.prefix}</span> ${linkedNames}${suffix}.`;
}

function renderIngredientMatches(matchedIngredients) {
  if (!matchedIngredients || !matchedIngredients.length) {
    ingredientMatchList.innerHTML = `<p class="history-empty">${currentLanguage === "vi" ? "Chua co giai thich thanh phan phu hop cho ket qua nay." : "No ingredient explanations are available for this result."}</p>`;
    return;
  }

  ingredientMatchList.innerHTML = matchedIngredients
    .map(
      (ingredient) => `
        <div class="ingredient-match-item">
          <strong>
            <a
              class="ingredient-link"
              href="${getIngredientGoogleLink(ingredient.key)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Google definition for ${capitalize(ingredient.key)}"
            >${capitalize(ingredient.key)}</a>
          </strong>
          <small>${localizeIngredientCategory(ingredient.category)}</small>
          <span>${localizeIngredientExplanation(ingredient)}</span>
        </div>
      `
    )
    .join("");
}

// Update the result area with a friendly, presentation-ready summary.
function renderResult(productName, analysis) {
  lastRenderedAnalysis = analysis;
  const statusClassMap = {
    "Looks suitable": "result-status-safe",
    "Use with care": "result-status-neutral",
    "Not yet able to analyze": "result-status-neutral",
    "Should not be used": "result-status-danger",
    "Not ideal for this profile": "result-status-danger"
  };
  const statusClass = statusClassMap[analysis.status] || "result-status-neutral";
  const translatedStatusMap = {
    "Looks suitable": t("statusLooksSuitable"),
    "Use with care": t("statusUseWithCare"),
    "Not yet able to analyze": t("statusNotYet"),
    "Should not be used": t("statusShouldNot"),
    "Not ideal for this profile": t("statusNotIdeal")
  };
  const translatedBadgeMap = {
    Suitable: t("badgeSuitable"),
    Caution: t("badgeCaution"),
    Limited: t("badgeLimited"),
    Avoid: t("badgeAvoid")
  };
  const scoreClass =
    analysis.status === "Should not be used" || analysis.status === "Not ideal for this profile"
      ? "result-score-danger"
      : analysis.suitabilityScore <= 40
        ? "result-score-danger"
        : analysis.suitabilityScore <= 70
          ? "result-score-warn"
          : "result-score-safe";

  resultHighlight.innerHTML = `
    <div class="led-border result-led-border" aria-hidden="true"></div>
    <p class="result-label">${t("suitability")}</p>
    <div class="result-title-row">
      <h3 class="${statusClass}">${translatedStatusMap[analysis.status] || analysis.status}</h3>
      <span class="result-score ${scoreClass}" title="Based on ingredient compatibility with your skin profile">${analysis.suitabilityScore}% match</span>
    </div>
    <p class="result-copy">${productName} has been reviewed using the quick ingredient logic and selected skin profile.</p>
    <span class="badge ${analysis.badgeClass}">${translatedBadgeMap[analysis.badgeText] || analysis.badgeText}</span>
  `;
  const resultLedBorder = resultHighlight.querySelector(".led-border");
  if (resultLedBorder) {
    buildLedBorder(resultLedBorder);
  }


  resultReasons.innerHTML = analysis.reasons.map((reason) => `<li>${formatReasonText(reason)}</li>`).join("");
  resultAction.textContent = analysis.actionText;
  resultNote.textContent = analysis.noteText;
  renderIngredientMatches(analysis.matchedIngredients);
}

function renderHistory() {
  if (!recentChecks.length) {
    historyList.innerHTML = `<p class="history-empty">${t("noRecentChecks")}</p>`;
    return;
  }

  historyList.innerHTML = recentChecks
    .slice()
    .reverse()
    .map(
      (item) => `
        <div class="history-item">
          <strong>${item.name}</strong>
          <span>${item.status}</span>
        </div>
      `
    )
    .join("");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isTouchDevice() {
  return window.matchMedia("(max-width: 1024px)").matches || navigator.maxTouchPoints > 0;
}

function setCameraState({ statusText, showVideo }) {
  const hasImagePreview = !!scannerImagePreview?.getAttribute("src");
  cameraStatus.textContent = statusText;
  scannerVideo.classList.toggle("is-active", showVideo);
  scannerPlaceholder.classList.toggle("is-hidden", showVideo || hasImagePreview);

  if (showVideo) {
    scannerImagePreview?.classList.remove("is-active");
  }
}

function closeMenu() {
  siteHeader.classList.remove("is-menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const isOpen = siteHeader.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function buildLedBorder(borderElement) {
  const hostCard = borderElement.closest(".feature-card, .result-highlight");
  if (!hostCard) {
    return;
  }

  const borderInset = 8;
  const dotSize = 6;
  const spacing = 14;
  const width = Math.max(hostCard.clientWidth - borderInset * 2, dotSize);
  const height = Math.max(hostCard.clientHeight - borderInset * 2, dotSize);
  const perimeter = width * 2 + height * 2;
  const dotCount = Math.max(24, Math.floor(perimeter / spacing));
  const step = perimeter / dotCount;
  const dots = [];

  borderElement.innerHTML = "";

  for (let index = 0; index < dotCount; index += 1) {
    const dot = document.createElement("span");
    let distance = index * step;
    let x = 0;
    let y = 0;

    if (distance <= width) {
      x = distance;
      y = 0;
    } else if (distance <= width + height) {
      distance -= width;
      x = width;
      y = distance;
    } else if (distance <= width * 2 + height) {
      distance -= width + height;
      x = width - distance;
      y = height;
    } else {
      distance -= width * 2 + height;
      x = 0;
      y = height - distance;
    }

    dot.className = "led-dot";
    dot.style.setProperty("--dot-x", `${x}px`);
    dot.style.setProperty("--dot-y", `${y}px`);
    dot.style.setProperty("--dot-delay", `${(-2.8 / dotCount) * index}s`);
    dots.push(dot);
  }

  borderElement.append(...dots);
}

function buildAllLedBorders() {
  document.querySelectorAll(".led-border").forEach((borderElement) => {
    buildLedBorder(borderElement);
  });
}

function writeProfiles() {
  localStorage.setItem(profileStorageKey, JSON.stringify(savedProfiles));
  cloudStatus.textContent = t("cloudUpdated");
}

function loadProfiles() {
  const storedProfiles = localStorage.getItem(profileStorageKey);
  if (!storedProfiles) {
    savedProfiles = [];
    return;
  }

  try {
    savedProfiles = JSON.parse(storedProfiles);
  } catch (error) {
    savedProfiles = [];
  }
}

function fillProfileForm(profile) {
  profileNameInput.value = profile.profileName;
  conditionNoteInput.value = profile.conditionNote || "";

  const selectedSkinTypes = profile.skinTypes && profile.skinTypes.length ? profile.skinTypes : [profile.skinType || "dry"];
  profileForm.querySelectorAll('input[name="skinType"]').forEach((input) => {
    input.checked = selectedSkinTypes.includes(input.value);
  });

  const selectedConcerns = profile.concerns || [];
  profileForm.querySelectorAll('input[name="concern"]').forEach((input) => {
    input.checked = selectedConcerns.includes(input.value);
  });

  updateProfileSummary();
}
function renderQuickProfileOptions() {
  quickProfileSelect.innerHTML = `<option value="current-form">${t("useCurrentProfile")}</option>`;

  savedProfiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.profileName;
    quickProfileSelect.appendChild(option);
  });

  if (activeProfileId && savedProfiles.some((profile) => profile.id === activeProfileId)) {
    quickProfileSelect.value = activeProfileId;
  }
}

function renderSavedProfiles() {
  if (!savedProfiles.length) {
    savedProfileList.innerHTML = `<p class="history-empty">${t("noSavedProfiles")}</p>`;
    return;
  }

  const concernMap = {
    acne: t("acneProne"),
    redness: t("redness"),
    fragrance: t("fragranceSensitivity"),
    barrier: t("weakSkinBarrier"),
    dehydration: t("dehydration")
  };

  savedProfileList.innerHTML = savedProfiles
    .map((profile) => {
      const concernText = profile.concerns.length ? profile.concerns.map((concern) => concernMap[concern] || concern).join(", ") : t("noExtraConcerns");
      const activeClass = profile.id === activeProfileId ? "is-active" : "";

      return `
        <button class="saved-profile-item ${activeClass}" type="button" data-profile-id="${profile.id}">
          <strong>${profile.profileName}</strong>
          <span>${localizeSkinTypes(profile.skinTypes && profile.skinTypes.length ? profile.skinTypes : [profile.skinType])}</span>
          <small>${concernText}</small>
        </button>
      `;
    })
    .join("");

  savedProfileList.querySelectorAll("[data-profile-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedProfile = savedProfiles.find((profile) => profile.id === button.dataset.profileId);
      if (!selectedProfile) {
        return;
      }

      activeProfileId = selectedProfile.id;
      fillProfileForm(selectedProfile);
      renderSavedProfiles();
      renderQuickProfileOptions();
      cloudStatus.textContent = t("cloudLoaded");
    });
  });
}

function saveNewProfile() {
  const profileData = getProfileData();
  const newProfile = {
    id: `profile-${Date.now()}`,
    ...profileData
  };

  savedProfiles.push(newProfile);
  activeProfileId = newProfile.id;
  localStorage.setItem(profileSetupStorageKey, "true");
  writeProfiles();
  renderSavedProfiles();
  renderQuickProfileOptions();
  updateProfileSummary();
  updateQuickCheckCardState();
}

function updateSelectedProfile() {
  if (!activeProfileId) {
    saveNewProfile();
    return;
  }

  savedProfiles = savedProfiles.map((profile) => {
    if (profile.id !== activeProfileId) {
      return profile;
    }

    return {
      ...profile,
      ...getProfileData()
    };
  });

  writeProfiles();
  renderSavedProfiles();
  renderQuickProfileOptions();
  updateProfileSummary();
}

function deleteSelectedProfile() {
  if (!activeProfileId) {
    return;
  }

  savedProfiles = savedProfiles.filter((profile) => profile.id !== activeProfileId);

  if (savedProfiles.length) {
    activeProfileId = savedProfiles[0].id;
    fillProfileForm(savedProfiles[0]);
  } else {
    activeProfileId = null;
    profileNameInput.value = "";
    conditionNoteInput.value = "";
    profileForm.querySelectorAll('input[name="concern"]').forEach((input) => {
      input.checked = false;
    });
    profileForm.querySelectorAll('input[name="skinType"]').forEach((input) => {
      input.checked = input.value === "dry";
    });
    updateProfileSummary();
  }

  writeProfiles();
  renderSavedProfiles();
  renderQuickProfileOptions();
  cloudStatus.textContent = t("cloudDeleted");
}

function openPanel(panelName, options = {}) {
  const { scrollToDetails = true } = options;

  detailPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panelContent === panelName);
  });

  dashboardCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.panel === panelName);
  });

  if (scrollToDetails) {
    document.getElementById("card-details").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (panelName !== "quick-check") {
    stopCamera();
  }
}

function updateDetailsScrollTopButton() {
  if (!detailsScrollTopButton || !cardDetailsSection) {
    return;
  }

  const detailsTop = cardDetailsSection.offsetTop;
  const detailsBottom = detailsTop + cardDetailsSection.offsetHeight;
  const viewportBottom = window.scrollY + window.innerHeight;
  const hasReachedDetailsBottom = viewportBottom >= detailsBottom - 80;
  const isInsideDetailsZone = window.scrollY >= detailsTop - 120;

  detailsScrollTopButton.classList.toggle("is-visible", hasReachedDetailsBottom && isInsideDetailsZone);
}

function isMobileOrTabletViewport() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

function clearScannerImagePreview() {
  if (scannerPreviewUrl && scannerPreviewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(scannerPreviewUrl);
  }
  scannerPreviewUrl = null;

  if (scannerImagePreview) {
    scannerImagePreview.removeAttribute("src");
    scannerImagePreview.classList.remove("is-active");
  }

  scannerPlaceholder?.classList.remove("is-hidden");
  setScannedTextOutput("");
}

function showScannerImagePreview(src) {
  if (!scannerImagePreview) {
    return;
  }

  scannerImagePreview.src = src;
  scannerImagePreview.classList.add("is-active");
  scannerPlaceholder?.classList.add("is-hidden");
}

function setScannerStatusMessage(message) {
  if (scannerPlaceholder) {
    scannerPlaceholder.textContent = message;
  }
}

function isUnsupportedMobileImage(file) {
  const fileName = String(file?.name || "").toLowerCase();
  const fileType = String(file?.type || "").toLowerCase();
  return fileType.includes("heic") || fileType.includes("heif") || fileName.endsWith(".heic") || fileName.endsWith(".heif");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function setScannedTextOutput(value, options = {}) {
  const { canUseForAnalysis = true } = options;
  lastScannedIngredientText = canUseForAnalysis ? (value || "") : "";

  if (scannerExtractedText) {
    scannerExtractedText.value = value || "";
  }

  if (scannerOcrOutput) {
    scannerOcrOutput.hidden = !value;
  }

  useScannedTextButton?.toggleAttribute("disabled", !canUseForAnalysis || !value);
}

function applyScannedTextToAnalysisField() {
  const ingredientField = document.getElementById("ingredients");
  const productNameField = document.getElementById("productName");

  if (!ingredientField || !lastScannedIngredientText) {
    return;
  }

  ingredientField.value = lastScannedIngredientText;

  if (productNameField && !productNameField.value.trim()) {
    productNameField.value = t("scannedProductName");
  }

  ingredientField.focus();
  ingredientField.scrollIntoView({ behavior: "smooth", block: "center" });
}

function foldVietnameseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeDetectedIngredientText(rawText) {
  if (!rawText) {
    return "";
  }

  const compact = rawText
    .replace(/\r/g, "\n")
    .replace(/[|]/g, ", ")
    .replace(/[•·]/g, ", ")
    .replace(/[;]+/g, ", ")
    .replace(/\b1NCI\b/gi, "INCI")
    .replace(/\bINGREDIENTS?\b/gi, "Ingredients")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const foldedCompact = foldVietnameseText(compact);
  const anchorRegex = /(?:ingredients?|inci|composition|formula|thanh phan|bang thanh phan)\s*[:\-]?\s*/i;
  const anchorMatch = anchorRegex.exec(foldedCompact);
  const ingredientAnchor = anchorMatch ? compact.slice(anchorMatch.index + anchorMatch[0].length) : compact;

  const cleanedLines = ingredientAnchor
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^ingredients?\s*[:\-]?\s*/i, "")
        .replace(/^[\d.\-\s]+/, "")
        .trim()
    )
    .filter(Boolean)
    .filter((line) => {
      const foldedLine = foldVietnameseText(line).toLowerCase();
      return !/^(how to use|directions|warning|caution|made in|distributed by|expiry|exp|mfg|net wt|volume|barcode)/i.test(line) &&
        !/^(huong dan su dung|cach dung|cong dung|bao quan|xuat xu|don vi chiu trach nhiem|so lo|ngay san xuat|han su dung|the tich thuc|khoi luong tinh)/i.test(foldedLine);
    });

  const mergedText = cleanedLines
    .join(", ")
    .replace(/\s{2,}/g, " ")
    .replace(/,+/g, ",")
    .replace(/\s+,/g, ", ")
    .replace(/,\s*,/g, ", ")
    .replace(/([a-z])\s+([A-Z][a-z])/g, "$1, $2")
    .replace(/([a-z)])\s*(\d+%)/g, "$1, $2")
    .trim();

  const rawTokens = mergedText
    .split(/,|\n|;/)
    .map((token) => token.trim())
    .filter(Boolean);

  const filteredTokens = rawTokens.filter((token) => {
    const foldedToken = foldVietnameseText(token).toLowerCase();

    if (token.length < 2 || token.length > 90) {
      return false;
    }

    if (/^(www|http|tel|batch|lot|ref|shade|apply|avoid|for external use)/i.test(token)) {
      return false;
    }

    if (/^(thanh phan|bang thanh phan|huong dan su dung|cach dung|cong dung|bao quan|xuat xu)/i.test(foldedToken)) {
      return false;
    }

    if (!/[a-z]/i.test(token)) {
      return false;
    }

    return /[a-z]{3,}/i.test(token) || /\([^)]*\)/.test(token);
  });

  const uniqueTokens = filteredTokens.filter(
    (token, index, list) => list.findIndex((item) => normalizeIngredientName(item) === normalizeIngredientName(token)) === index
  );

  if (!uniqueTokens.length) {
    return "";
  }

  return uniqueTokens.join(", ");
}

async function detectTextFromImageSource(source) {
  if (!("TextDetector" in window)) {
    throw new Error("ocr_unsupported");
  }

  const detector = new window.TextDetector();
  const blocks = await detector.detect(source);
  return blocks
    .map((block) => block.rawValue || "")
    .filter(Boolean)
    .join("\n");
}

async function createDetectableImageSource(fileOrBlob) {
  if (window.createImageBitmap) {
    return createImageBitmap(fileOrBlob);
  }

  const image = new Image();
  const tempUrl = URL.createObjectURL(fileOrBlob);

  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = tempUrl;
  });

  URL.revokeObjectURL(tempUrl);
  return image;
}

function handleScannedIngredients(ingredientText, productName = "") {
  setScannedTextOutput(ingredientText);
  setCameraState({
    statusText: t("scanFilled"),
    showVideo: false
  });
  setScannerStatusMessage(t("scanAutoAnalyzing"));

  const productNameField = document.getElementById("productName");
  if (productName && productNameField && !productNameField.value.trim()) {
    productNameField.value = productName;
  }
}

async function processScannedImageViaBackend(fileOrBlob, previewSrc) {
  if (!ocrScanService?.extractIngredientsFromFile) {
    return false;
  }

  const response = await ocrScanService.extractIngredientsFromFile(fileOrBlob, { language: currentLanguage === "vi" ? "vi,en" : "en,vi" });
  if (!response?.ok) {
    return false;
  }

  clearScannerImagePreview();
  showScannerImagePreview(previewSrc);

  const ingredientText = normalizeDetectedIngredientText(response.data?.extractedText || response.data?.rawText || "");
  if (!ingredientText) {
    setCameraState({
      statusText: t("cameraIdle"),
      showVideo: false
    });
    setScannerStatusMessage(t("scanNoText"));
    setScannedTextOutput(t("scanNoText"), { canUseForAnalysis: false });
    return true;
  }

  handleScannedIngredients(ingredientText, response.data?.productName || "");
  return true;
}

async function processScannedImageBitmap(imageBitmap, previewSrc) {
  setCameraState({
    statusText: t("scanProcessing"),
    showVideo: false
  });
  clearScannerImagePreview();
  showScannerImagePreview(previewSrc);
  setScannerStatusMessage(t("scanProcessing"));

  try {
    const detectedText = await detectTextFromImageSource(imageBitmap);
    const ingredientText = normalizeDetectedIngredientText(detectedText);

    if (!ingredientText) {
      setCameraState({
        statusText: t("cameraIdle"),
        showVideo: false
      });
      setScannerStatusMessage(t("scanNoText"));
      setScannedTextOutput(t("scanNoText"), { canUseForAnalysis: false });
      return;
    }

    handleScannedIngredients(ingredientText);
  } catch (error) {
    setCameraState({
      statusText: t("cameraIdle"),
      showVideo: false
    });
    const errorMessage = error?.message === "ocr_unsupported" ? t("scanOcrUnsupported") : t("scanNoText");
    setScannerStatusMessage(errorMessage);
    setScannedTextOutput(errorMessage, { canUseForAnalysis: false });
  }
}

async function processScannedImageFile(file) {
  if (!file) {
    return;
  }

  try {
    if (isUnsupportedMobileImage(file)) {
      throw new Error("image_format_unsupported");
    }

    clearScannerImagePreview();
    scannerPreviewUrl = await readFileAsDataUrl(file);

    const usedBackend = await processScannedImageViaBackend(file, scannerPreviewUrl);
    if (usedBackend) {
      return;
    }

    const imageSource = await createDetectableImageSource(file);
    await processScannedImageBitmap(imageSource, scannerPreviewUrl);
  } catch (error) {
    setCameraState({
      statusText: t("cameraIdle"),
      showVideo: false
    });
    const errorMessage = error?.message === "image_format_unsupported" ? t("scanImageUnsupported") : t("scanNoText");
    setScannerStatusMessage(errorMessage);
    setScannedTextOutput(errorMessage, { canUseForAnalysis: false });
  }
}

async function capturePhotoFromCamera() {
  if (!scannerVideo || !scannerVideo.videoWidth || !scannerVideo.videoHeight) {
    scanImageInput?.click();
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = scannerVideo.videoWidth;
  canvas.height = scannerVideo.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) {
    return;
  }

  const previewSrc = canvas.toDataURL("image/jpeg", 0.9);
  const usedBackend = await processScannedImageViaBackend(blob, previewSrc);
  if (usedBackend) {
    return;
  }

  const imageBitmap = await createDetectableImageSource(blob);
  await processScannedImageBitmap(imageBitmap, previewSrc);
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraState({
      statusText: t("cameraUnsupported"),
      showVideo: false
    });
    scannerPlaceholder.textContent = t("scanUnsupported");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment"
        }
      },
      audio: false
    });

    clearScannerImagePreview();
    scannerVideo.srcObject = cameraStream;
    setCameraState({
      statusText: t("cameraLive"),
      showVideo: true
    });
  } catch (error) {
    setCameraState({
      statusText: t("cameraBlocked"),
      showVideo: false
    });
    scannerPlaceholder.textContent = t("scanBlocked");
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  scannerVideo.srcObject = null;
  clearScannerImagePreview();
  setCameraState({
    statusText: t("cameraIdle"),
    showVideo: false
  });

  scannerPlaceholder.textContent = t("scanPlaceholder");
}

function ensureSoundContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const ContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new ContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function ensureBackgroundMusic() {
  if (!backgroundMusicAvailable) {
    return null;
  }

  if (backgroundMusic) {
    return backgroundMusic;
  }

  try {
    backgroundMusic = new Audio("assets/music_background.wav");
    backgroundMusic.preload = "none";
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0;
    backgroundMusic.playsInline = true;
    backgroundMusic.setAttribute("playsinline", "");
    backgroundMusic.setAttribute("webkit-playsinline", "");
    backgroundMusic.addEventListener("error", () => {
      backgroundMusicAvailable = false;
      backgroundMusic = null;
      backgroundMusicEnabled = false;
      updateBackgroundMusicToggle();
    });
  } catch (error) {
    backgroundMusicAvailable = false;
    backgroundMusic = null;
    return null;
  }

  return backgroundMusic;
}

function updateBackgroundMusicToggle() {
  if (!backgroundMusicToggle) {
    return;
  }

  backgroundMusicToggle.dataset.state = backgroundMusicEnabled ? "playing" : "paused";
  backgroundMusicToggle.setAttribute("aria-pressed", String(backgroundMusicEnabled));
  backgroundMusicToggle.setAttribute(
    "aria-label",
    backgroundMusicEnabled
      ? (currentLanguage === "vi" ? "Tắt nhạc nền" : "Turn off background music")
      : (currentLanguage === "vi" ? "Bật nhạc nền" : "Turn on background music")
  );

  const label = backgroundMusicToggle.querySelector(".background-music-toggle-text");
  if (label) {
    label.textContent = backgroundMusicEnabled
      ? (currentLanguage === "vi" ? "Nhạc bật" : "Sound On")
      : (currentLanguage === "vi" ? "Nhạc tắt" : "Sound Off");
  }
}

function fadeInBackgroundMusic(targetVolume = backgroundMusicTargetVolume, duration = 1600) {
  const audio = ensureBackgroundMusic();
  if (!audio) {
    return;
  }

  const frameStep = 50;
  const totalSteps = Math.max(1, Math.round(duration / frameStep));
  let currentStep = 0;

  if (backgroundMusicFadeTimer) {
    window.clearInterval(backgroundMusicFadeTimer);
  }

  audio.volume = 0;

  backgroundMusicFadeTimer = window.setInterval(() => {
    currentStep += 1;
    audio.volume = Math.min(targetVolume, (targetVolume * currentStep) / totalSteps);

    if (currentStep >= totalSteps) {
      window.clearInterval(backgroundMusicFadeTimer);
      backgroundMusicFadeTimer = null;
      audio.volume = targetVolume;
    }
  }, frameStep);
}

function playBackgroundMusic({ fadeIn = false } = {}) {
  const audio = ensureBackgroundMusic();

  if (!audio) {
    backgroundMusicEnabled = false;
    updateBackgroundMusicToggle();
    return;
  }

  backgroundMusicStarted = true;
  audio.volume = fadeIn ? 0 : backgroundMusicTargetVolume;

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }

  backgroundMusicEnabled = true;
  updateBackgroundMusicToggle();

  if (fadeIn) {
    fadeInBackgroundMusic();
  }
}

function pauseBackgroundMusic() {
  const audio = ensureBackgroundMusic();
  if (!audio) {
    backgroundMusicEnabled = false;
    updateBackgroundMusicToggle();
    return;
  }

  if (backgroundMusicFadeTimer) {
    window.clearInterval(backgroundMusicFadeTimer);
    backgroundMusicFadeTimer = null;
  }

  audio.pause();
  backgroundMusicEnabled = false;
  updateBackgroundMusicToggle();
}

function unlockAudioExperience() {
  ensureSoundContext();
  removeAudioUnlockListeners();
}

function removeAudioUnlockListeners() {
  if (!audioUnlockBound) {
    return;
  }

  ["pointerdown", "touchstart", "click", "keydown"].forEach((eventName) => {
    window.removeEventListener(eventName, unlockAudioExperience, true);
  });

  audioUnlockBound = false;
}

function bindAudioUnlockListeners() {
  if (audioUnlockBound) {
    return;
  }

  ["pointerdown", "touchstart", "click", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, unlockAudioExperience, { once: false, passive: true, capture: true });
  });

  audioUnlockBound = true;
}

function resumeAudioIfNeeded() {
  if (document.hidden) {
    return;
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch?.(() => {});
  }

  if (backgroundMusicEnabled && backgroundMusic && backgroundMusic.paused) {
    const playPromise = backgroundMusic.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }
}

function playTone({ frequency, type = "sine", duration = 0.25, volume = 0.025, delay = 0, attack = 0.02 }) {
  const context = ensureSoundContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + delay;
  const stopTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(stopTime + 0.02);
}

function startAmbientSound() {
  if (ambientStarted) {
    if (!backgroundMusicStarted) {
      playBackgroundMusic({ fadeIn: true });
    }
    return;
  }

  const context = ensureSoundContext();
  if (!context) {
    playBackgroundMusic({ fadeIn: true });
    return;
  }

  ambientStarted = true;
  ambientGain = context.createGain();
  ambientGain.gain.value = 0.0001;
  ambientGain.connect(context.destination);

  const tones = [
    { frequency: 196, type: "sine" },
    { frequency: 293.66, type: "triangle" },
    { frequency: 392, type: "sine" }
  ];

  ambientOscillators = tones.map((tone, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.value = tone.frequency;
    gainNode.gain.value = 0.007 + index * 0.0018;
    oscillator.connect(gainNode);
    gainNode.connect(ambientGain);
    oscillator.start();
    return { oscillator, gainNode };
  });

  ambientGain.gain.linearRampToValueAtTime(0.085, context.currentTime + 2.8);
  playBackgroundMusic({ fadeIn: true });
}

function playUiClickSound() {
  playTone({ frequency: 620, type: "triangle", duration: 0.08, volume: 0.075, attack: 0.01 });
  playTone({ frequency: 830, type: "sine", duration: 0.1, volume: 0.06, delay: 0.03, attack: 0.01 });
}

function playResultSound(status) {
  if (status === "Looks suitable") {
    playTone({ frequency: 523.25, type: "sine", duration: 0.22, volume: 0.1 });
    playTone({ frequency: 659.25, type: "sine", duration: 0.24, volume: 0.092, delay: 0.08 });
    playTone({ frequency: 783.99, type: "triangle", duration: 0.28, volume: 0.086, delay: 0.16 });
    return;
  }

  if (status === "Should not be used" || status === "Not ideal for this profile") {
    playTone({ frequency: 293.66, type: "sawtooth", duration: 0.2, volume: 0.086 });
    playTone({ frequency: 246.94, type: "triangle", duration: 0.26, volume: 0.09, delay: 0.08 });
    playTone({ frequency: 196, type: "sine", duration: 0.32, volume: 0.084, delay: 0.15 });
    return;
  }

  playTone({ frequency: 349.23, type: "triangle", duration: 0.18, volume: 0.084 });
  playTone({ frequency: 311.13, type: "sine", duration: 0.2, volume: 0.076, delay: 0.08 });
  playTone({ frequency: 261.63, type: "triangle", duration: 0.26, volume: 0.07, delay: 0.18 });
}

backgroundMusicToggle?.addEventListener("click", () => {
  playUiClickSound();
  removeAudioUnlockListeners();

  if (backgroundMusicEnabled) {
    pauseBackgroundMusic();
    return;
  }

  playBackgroundMusic({ fadeIn: !backgroundMusicStarted });
});

function showResultLoadingState() {
  if (!resultLoadingOverlay) {
    return;
  }

  resultLoadingOverlay.classList.add("is-active");
  resultLoadingOverlay.setAttribute("aria-hidden", "false");
}

function hideResultLoadingState() {
  if (!resultLoadingOverlay) {
    return;
  }

  resultLoadingOverlay.classList.remove("is-active");
  resultLoadingOverlay.setAttribute("aria-hidden", "true");
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  playUiClickSound();

  const formData = {
    productName: document.getElementById("productName").value.trim(),
    ingredients: document.getElementById("ingredients").value.trim(),
    productType: document.getElementById("productType").value
  };

  const profile = getAnalysisProfile();
  openPanel("results");
  showResultLoadingState();

  let resolvedFormData = { ...formData };
  let analysis;

  try {
    if (externalProductAnalysisService?.prepareProductAnalysis) {
      const externalContext = await externalProductAnalysisService.prepareProductAnalysis(formData, profile);
      resolvedFormData = externalContext?.mergedFormData || resolvedFormData;
      analysis = mergeAnalysisWithExternalData(analyzeProduct(resolvedFormData, profile), externalContext);
      traceAnalysisDebug({
        mode: getAnalysisSourceMode(analysis),
        inputProductName: formData.productName,
        resolvedProductName: resolvedFormData.productName,
        externalSources: analysis.sources || [],
        matchedIngredients: analysis.matchedIngredients?.map((item) => item.key) || [],
        errors: externalContext?.errors || []
      });
    } else {
      analysis = analyzeProduct(resolvedFormData, profile);
      traceAnalysisDebug({
        mode: "local-only",
        inputProductName: formData.productName,
        resolvedProductName: resolvedFormData.productName,
        externalSources: [],
        matchedIngredients: analysis.matchedIngredients?.map((item) => item.key) || [],
        errors: []
      });
    }
  } catch (error) {
    analysis = analyzeProduct(resolvedFormData, profile);
    traceAnalysisDebug({
      mode: "local-only",
      inputProductName: formData.productName,
      resolvedProductName: resolvedFormData.productName,
      externalSources: [],
      matchedIngredients: analysis.matchedIngredients?.map((item) => item.key) || [],
      errors: [{ type: "integration_error", message: error?.message || "Unknown integration error" }]
    });
  }

  if (analysisTimer) {
    window.clearTimeout(analysisTimer);
  }

  analysisTimer = window.setTimeout(() => {
    renderResult(resolvedFormData.productName, analysis);
    recentChecks.push({ name: resolvedFormData.productName, status: analysis.status, sources: analysis.sources || [] });
    renderHistory();
    hideResultLoadingState();
    playResultSound(analysis.status);
    analysisTimer = null;
  }, 1700);
});

sampleButton.addEventListener("click", () => {
  playUiClickSound();
  loadSampleData();
});

profileForm.addEventListener("change", () => {
  updateProfileSummary();
});

saveProfileButton.addEventListener("click", () => {
  playUiClickSound();
  saveNewProfile();
  scrollToQuickCheckCard();
});

updateProfileButton.addEventListener("click", () => {
  playUiClickSound();
  updateSelectedProfile();
  scrollToQuickCheckCard();
});

deleteProfileButton.addEventListener("click", () => {
  playUiClickSound();
  deleteSelectedProfile();
});

startCameraButton.addEventListener("click", () => {
  playUiClickSound();
  startCamera();
});

stopCameraButton.addEventListener("click", () => {
  playUiClickSound();
  stopCamera();
});

capturePhotoButton?.addEventListener("click", async () => {
  playUiClickSound();

  if (!isTouchDevice()) {
    return;
  }

  scanImageInput?.setAttribute("capture", "environment");

  if (cameraStream && scannerVideo?.srcObject) {
    await capturePhotoFromCamera();
    return;
  }

  scanImageInput?.click();
});

uploadPhotoButton?.addEventListener("click", () => {
  playUiClickSound();

  scanImageInput?.removeAttribute("capture");
  scanImageInput?.click();
});

scanImageInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  await processScannedImageFile(file);
  event.target.value = "";
});

useScannedTextButton?.addEventListener("click", () => {
  playUiClickSound();
  applyScannedTextToAnalysisField();
  productForm?.requestSubmit();
});

assistantButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playUiClickSound();
    assistantButtons.forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
    assistantResponse.textContent = getAssistantAnswers()[button.dataset.help];
  });
});

dashboardCards.forEach((card) => {
  card.addEventListener("click", () => {
    playUiClickSound();
    openPanel(card.dataset.panel, { scrollToDetails: true });
  });

  card.addEventListener("keydown", (event) => {
    if (event.target.closest(".feature-card-toggle")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playUiClickSound();
      openPanel(card.dataset.panel, { scrollToDetails: true });
    }
  });
});

desktopCollapsibleCards.forEach((card) => {
  const toggle = card.querySelector(".feature-card-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isDesktopViewport()) {
      return;
    }

    playUiClickSound();
    const shouldExpand = !card.classList.contains("is-expanded");
    setDesktopCardCollapsedState(card, shouldExpand);
  });
});

detailsScrollTopButton?.addEventListener("click", () => {
  playUiClickSound();
  dashboardSection?.scrollIntoView({ behavior: "smooth", block: "start" });
});

menuToggle.addEventListener("click", () => {
  playUiClickSound();
  toggleMenu();
});

topNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    playUiClickSound();
    closeMenu();
  });
});

languageSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playUiClickSound();
    applyLanguage(button.dataset.lang);
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    closeMenu();
  }

  updateDetailsScrollTopButton();
});

window.addEventListener("scroll", updateDetailsScrollTopButton, { passive: true });
window.addEventListener("scroll", updateHeaderScrollState, { passive: true });

loadProfiles();
if (savedProfiles.length) {
  activeProfileId = savedProfiles[0].id;
  fillProfileForm(savedProfiles[0]);
  localStorage.setItem(profileSetupStorageKey, "true");
}

buildAllLedBorders();
window.addEventListener("resize", buildAllLedBorders);

if (!isTouchDevice()) {
  cameraStatus.textContent = t("cameraBestOnMobile");
  scannerPlaceholder.textContent = t("scanDesktopInfo");
}

openPanel("profile", { scrollToDetails: false });
updateQuickCheckCardState();
updateDetailsScrollTopButton();
updateHeaderScrollState();
updateBackgroundMusicToggle();
syncDesktopCollapsibleCards();
applyLanguage(currentLanguage);
bindAudioUnlockListeners();
document.addEventListener("visibilitychange", resumeAudioIfNeeded);
window.addEventListener("pageshow", resumeAudioIfNeeded);
window.addEventListener("resize", syncDesktopCollapsibleCards);
syncMascotPlayback();
window.addEventListener("resize", syncMascotPlayback);

(() => {
  const MOBILE_MENU_QUERY = "(max-width: 1023px)";
  const menuMediaQuery = window.matchMedia(MOBILE_MENU_QUERY);

  function closeMobileMenu() {
    if (!mobileMenuOverlay || !mobileNavToggle) {
      return;
    }

    mobileMenuOverlay.classList.remove("is-open");
    mobileMenuOverlay.style.display = "none";
    mobileNavToggle.setAttribute("aria-expanded", "false");
  }

  function openMobileMenu() {
    if (!mobileMenuOverlay || !mobileNavToggle) {
      return;
    }

    renderMobileMenu();
    mobileMenuOverlay.style.display = "flex";
    mobileMenuOverlay.classList.add("is-open");
    mobileNavToggle.setAttribute("aria-expanded", "true");
  }

  function renderMobileMenu() {
    if (mobileSectionToolbarTrack) {
      mobileSectionToolbarTrack.innerHTML = "";
    }
    if (mobileMenuList) {
      mobileMenuList.innerHTML = "";
    }

    if (!menuMediaQuery.matches) {
      closeMobileMenu();
      return;
    }

    dashboardCards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent?.trim();
      if (!title) {
        return;
      }

      const item = document.createElement("button");
      item.className = "mobile-menu-item";
      item.type = "button";
      item.textContent = title;
      item.addEventListener("click", () => {
        playUiClickSound();
        closeMobileMenu();
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      mobileMenuList?.appendChild(item);

      const toolbarItem = document.createElement("button");
      toolbarItem.className = "mobile-section-toolbar-item";
      toolbarItem.type = "button";
      toolbarItem.textContent = title;
      toolbarItem.addEventListener("click", () => {
        playUiClickSound();
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      mobileSectionToolbarTrack?.appendChild(toolbarItem);
    });

    const topItem = document.createElement("button");
    topItem.className = "mobile-menu-item mobile-menu-item--top";
    topItem.type = "button";
    topItem.textContent = "Scroll to Top";
    topItem.addEventListener("click", () => {
      playUiClickSound();
      closeMobileMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    mobileMenuList?.appendChild(topItem);

    const toolbarTopItem = document.createElement("button");
    toolbarTopItem.className = "mobile-section-toolbar-item mobile-section-toolbar-item--top";
    toolbarTopItem.type = "button";
    toolbarTopItem.textContent = "Scroll to Top";
    toolbarTopItem.addEventListener("click", () => {
      playUiClickSound();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    mobileSectionToolbarTrack?.appendChild(toolbarTopItem);

    if (mobileMenuOverlay?.classList.contains("is-open")) {
      mobileMenuOverlay.style.display = "flex";
    }

  }

  mobileNavToggle?.addEventListener("click", () => {
    playUiClickSound();
    if (mobileMenuOverlay?.classList.contains("is-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileMenuOverlay?.addEventListener("click", (event) => {
    if (event.target === mobileMenuOverlay) {
      closeMobileMenu();
    }
  });

  renderMobileMenu();
  if (typeof menuMediaQuery.addEventListener === "function") {
    menuMediaQuery.addEventListener("change", renderMobileMenu);
  } else {
    menuMediaQuery.addListener(renderMobileMenu);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
})();

(() => {
  const FLORAL_QUERY = "(min-width: 0px)";
  const floralClass = "floral-bg-module";
  const floralLayerClass = "floral-bg-layer";
  const bodyReadyClass = "floral-bg-ready";
  const mediaQuery = window.matchMedia(FLORAL_QUERY);
  const floralAsset = "assets/bg_Flower.png";

  const floralConfigs = [
    {
      side: "left",
      top: "2vh",
      width: 270,
      height: 440,
      delay: "0s",
      duration: "17s",
      transform: "translateX(-46%) rotate(-10deg)",
      rotate: "-10deg",
      layer: "base"
    },
    {
      side: "left",
      top: "54vh",
      width: 220,
      height: 360,
      delay: "-4s",
      duration: "18s",
      transform: "translateX(-40%) rotate(14deg)",
      rotate: "14deg",
      layer: "base"
    },
    {
      side: "right",
      top: "4vh",
      width: 300,
      height: 470,
      delay: "-2s",
      duration: "16s",
      transform: "translateX(48%) rotate(12deg)",
      rotate: "12deg",
      layer: "base"
    },
    {
      side: "right",
      top: "58vh",
      width: 220,
      height: 360,
      delay: "-6s",
      duration: "19s",
      transform: "translateX(38%) rotate(-14deg)",
      rotate: "-14deg",
      layer: "base"
    },
    {
      side: "left",
      top: "22vh",
      width: 180,
      height: 290,
      delay: "-9s",
      duration: "15s",
      transform: "translateX(-52%) rotate(22deg)",
      rotate: "22deg",
      layer: "accent"
    },
    {
      side: "right",
      top: "34vh",
      width: 170,
      height: 285,
      delay: "-11s",
      duration: "18s",
      transform: "translateX(54%) rotate(-20deg)",
      rotate: "-20deg",
      layer: "accent"
    }
  ];

  function removeFloralModule() {
    const existingModule = document.querySelector(`.${floralClass}`);
    if (existingModule) {
      existingModule.remove();
    }
    document.body.classList.remove(bodyReadyClass);
  }

  function renderFloralModule() {
    removeFloralModule();

    const module = document.createElement("div");
    module.className = floralClass;
    module.setAttribute("aria-hidden", "true");

    const layers = {
      base: document.createElement("div"),
      accent: document.createElement("div")
    };

    layers.base.className = `${floralLayerClass} ${floralLayerClass}--base`;
    layers.accent.className = `${floralLayerClass} ${floralLayerClass}--accent`;

    floralConfigs.forEach((config) => {
      const element = document.createElement("div");
      element.className = `floral-bg-element floral-bg-element--${config.side}`;
      element.style.top = config.top;
      element.style.width = `${config.width}px`;
      element.style.height = `${config.height}px`;
      element.style.backgroundImage = `url("${floralAsset}")`;
      element.style.animationDelay = config.delay;
      element.style.animationDuration = config.duration;
      element.style.setProperty("--floral-transform", config.transform);
      element.style.setProperty("--floral-rotate", config.rotate);
      layers[config.layer].appendChild(element);
    });

    module.appendChild(layers.base);
    module.appendChild(layers.accent);
    document.body.prepend(module);
    document.body.classList.add(bodyReadyClass);
  }

  renderFloralModule();
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", renderFloralModule);
  } else {
    mediaQuery.addListener(renderFloralModule);
  }
})();

























