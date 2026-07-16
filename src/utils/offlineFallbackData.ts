export interface FallbackSubject {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  quizzesCount: number;
  questionsCount: number;
  difficulty: string;
  estimatedTime: string;
}

export interface FallbackQuiz {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  coverImage: string;
  type: string;
  timeLimit: number;
  questionsCount: number;
  points: number;
  isPublished: boolean;
  isTodayQuiz?: boolean;
}

export interface FallbackQuestion {
  id: string;
  quizId: string;
  subjectId: string;
  text: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correctAnswer: string;
  explanation: string;
  scriptureRef: string;
  chapter?: string;
  verse?: string;
}

export const fallbackSubjects: FallbackSubject[] = [
  {
    id: 'bhagavad_gita',
    name: 'Bhagavad Gita (श्रीमद्भगवद्गीता)',
    description: 'अर्जुन और भगवान श्रीकृष्ण के मध्य कुरुक्षेत्र में हुआ पावन संवाद, जो जीवन जीने की कला सिखाता है।',
    coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
    quizzesCount: 18,
    questionsCount: 450,
    difficulty: 'Intermediate',
    estimatedTime: '15 mins/chapter'
  },
  {
    id: 'hanuman_chalisa',
    name: 'Hanuman Chalisa (हनुमान चालीसा)',
    description: 'महाकवि तुलसीदास जी द्वारा रचित, पवनपुत्र हनुमान जी की असीम शक्ति और भक्ति का पावन गान।',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    quizzesCount: 2,
    questionsCount: 50,
    difficulty: 'Beginner',
    estimatedTime: '10 mins/part'
  },
  {
    id: 'ramcharitmanas',
    name: 'Ramcharitmanas (श्रीरामचरितमानस)',
    description: 'गोस्वामी तुलसीदास जी द्वारा रचित अवधी रामायण, जो मर्यादा पुरुषोत्तम श्रीराम के आदर्श चरित्र को दर्शाती है।',
    coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
    quizzesCount: 7,
    questionsCount: 175,
    difficulty: 'Advanced',
    estimatedTime: '12 mins/kand'
  },
  {
    id: 'ramayana',
    name: 'Valmiki Ramayana (वाल्मीकि रामायण)',
    description: 'आदिकवि वाल्मीकि द्वारा संस्कृत महाकाव्य में रचित मर्यादा पुरुषोत्तम श्रीराम की मूल गाथा।',
    coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
    quizzesCount: 7,
    questionsCount: 175,
    difficulty: 'Advanced',
    estimatedTime: '12 mins/kand'
  }
];

export const fallbackQuizzes: FallbackQuiz[] = [
  {
    id: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    name: 'Gita Chapter 2 Wisdom (गीता द्वितीय अध्याय ज्ञान)',
    description: 'सांख्य योग, आत्मा की अमरता और स्थिरप्रज्ञ पुरुष के दिव्य लक्षणों पर आधारित पावन प्रश्नोत्तरी।',
    coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80',
    type: 'timed',
    timeLimit: 120,
    questionsCount: 4,
    points: 40,
    isPublished: true,
    isTodayQuiz: true
  },
  {
    id: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    name: 'Gita Devotional Quiz (भक्ति योग प्रश्नोत्तरी)',
    description: 'भगवान श्रीकृष्ण के विराट रूप और अनन्य भक्ति की महिमा पर प्रश्नोत्तरी।',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    type: 'practice',
    timeLimit: 180,
    questionsCount: 3,
    points: 30,
    isPublished: true,
    isTodayQuiz: false
  },
  {
    id: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    name: 'Hanuman Chalisa Stanzas (हनुमान चालीसा महिमा)',
    description: 'चालीसा की चौपाइयों में निहित गूढ़ रहस्यों, अर्थों और संकटमोचन के पावन सूत्रों का ज्ञान।',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    type: 'daily',
    timeLimit: 120,
    questionsCount: 4,
    points: 40,
    isPublished: true,
    isTodayQuiz: false
  }
];

export const fallbackQuestions: FallbackQuestion[] = [
  {
    id: 'q_gita_1',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'भगवद्गीता के द्वितीय अध्याय में भगवान श्रीकृष्ण ने अर्जुन को सर्वप्रथम कौन सा उपदेश दिया?',
    type: 'mcq',
    options: [
      'आत्मा की अमरता का उपदेश (सांख्य योग)',
      'कर्मकांड की विधियों का ज्ञान',
      'कुरुक्षेत्र से भाग जाने की सलाह',
      'केवल पूजा-अर्चना करने का आदेश'
    ],
    correctAnswer: 'आत्मा की अमरता का उपदेश (सांख्य योग)',
    explanation: 'भगवान श्रीकृष्ण ने अर्जुन के विषाद को दूर करने के लिए सर्वप्रथम आत्मा की नित्यता और शरीर की अनित्यता का ज्ञान दिया, जिसे सांख्य योग कहा जाता है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '2',
    verse: '11-30'
  },
  {
    id: 'q_gita_2',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'भगवद्गीता के अनुसार, क्या आत्मा (Atma) कभी नष्ट हो सकती है या मारी जा सकती है?',
    type: 'true_false',
    options: ['सही (True)', 'गलत (False)'],
    correctAnswer: 'सही (True)',
    explanation: 'अध्याय 2, श्लोक 20 के अनुसार, आत्मा न कभी जन्म लेती है और न कभी मरती है; यह अजन्मा, नित्य, सनातन और पुरातन है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '2',
    verse: '20'
  },
  {
    id: 'q_gita_3',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'श्रीकृष्ण ने कर्म करने के संदर्भ में कौन सा अत्यंत प्रसिद्ध उपदेश दिया है?',
    type: 'mcq',
    options: [
      'कर्म ही मत करो, सब भाग्य पर छोड़ दो',
      'कर्म पर ही तुम्हारा अधिकार है, उसके फल पर कभी नहीं',
      'फल की पहले चिंता करो, फिर कर्म करो',
      'कर्म केवल स्वार्थ के लिए करो'
    ],
    correctAnswer: 'कर्म पर ही तुम्हारा अधिकार है, उसके फल पर कभी नहीं',
    explanation: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन श्लोक में भगवान ने स्पष्ट किया है कि मनुष्य का कर्तव्य केवल कर्म करना है, फल की लालसा रखना नहीं।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '2',
    verse: '47'
  },
  {
    id: 'q_gita_4',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'गीता में "स्थिरप्रज्ञ" (Stithaprajna) किसे कहा गया है?',
    type: 'mcq',
    options: [
      'जो बहुत अधिक धनवान हो',
      'जिसकी बुद्धि सुख और दुःख दोनों में अविचलित (समान) रहती है',
      'जो सदैव युद्ध के लिए तत्पर रहे',
      'जो सांसारिक कर्तव्यों का सर्वथा त्याग कर दे'
    ],
    correctAnswer: 'जिसकी बुद्धि सुख और दुःख दोनों में अविचलित (समान) रहती है',
    explanation: 'जो राग, भय, और क्रोध से सर्वथा मुक्त है, और जिसका मन सुख-दुःख में स्थिर रहता है, उसे ही स्थिरप्रज्ञ कहा गया है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '2',
    verse: '56'
  },
  {
    id: 'q_hc_1',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: 'प्रसिद्ध हनुमान चालीसा की रचना किनके द्वारा की गई थी?',
    type: 'mcq',
    options: ['गोस्वामी तुलसीदास जी', 'संत कबीरदास जी', 'वेदव्यास जी', 'वाल्मीकि जी'],
    correctAnswer: 'गोस्वामी तुलसीदास जी',
    explanation: 'हनुमान चालीसा की रचना महान भक्त और कवि गोस्वामी तुलसीदास जी द्वारा 16वीं शताब्दी में की गई थी।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'प्रस्तावना',
    verse: '1'
  },
  {
    id: 'q_hc_2',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: 'हनुमान जी को समस्त "अष्ट सिद्धि और नवनिधि" के दाता होने का वरदान किसने दिया था?',
    type: 'mcq',
    options: ['माता जानकी (सीता जी)', 'प्रभु श्रीराम', 'भगवान शिव', 'देवराज इन्द्र'],
    correctAnswer: 'माता जानकी (सीता जी)',
    explanation: '"अष्ट सिद्धि नव निधि के दाता। अस बर दीन्ह जानकी माता।" जानकी माता (सीता जी) ने प्रसन्न होकर हनुमान जी को यह अनुपम वरदान दिया था।',
    scriptureRef: 'Hanuman Chalisa',
    chapter: 'चौपाई',
    verse: '31'
  }
];

export const fallbackQuotes = [
  {
    id: 'quote_1',
    text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    meaning: 'कर्म करने में ही तुम्हारा अधिकार है, उसके फलों में कभी नहीं। तुम कर्मों के फल के हेतु मत बनो और तुम्हारी कर्म न करने में भी आसक्ति न हो।',
    source: 'श्रीमद्भगवद्गीता (२.४७)',
    likesCount: 108,
    bookmarksCount: 54
  },
  {
    id: 'quote_2',
    text: 'यदा यदा ही धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
    meaning: 'हे भारत! जब-जब धर्म की हानि होती है और अधर्म का उत्थान होता है, तब-तब मैं अपने साकार रूप को प्रकट करता हूँ।',
    source: 'श्रीमद्भगवद्गीता (४.७)',
    likesCount: 251,
    bookmarksCount: 120
  },
  {
    id: 'quote_3',
    text: 'परित्राणाय साधूनां विनाशाय च दुष्कृताम्। धर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥',
    meaning: 'सज्जनों की रक्षा करने के लिए, पापियों का विनाश करने के लिए और धर्म की भलीभांति स्थापना करने के लिए मैं युग-युग में प्रकट होता हूँ।',
    source: 'श्रीमद्भगवद्गीता (४.८)',
    likesCount: 195,
    bookmarksCount: 95
  },
  {
    id: 'quote_4',
    text: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामी मा शुचः॥',
    meaning: 'सभी धर्मों को त्यागकर केवल मेरी शरण में आ जाओ। मैं तुम्हें सभी पापों से मुक्त कर दूँगा, शोक मत करो।',
    source: 'श्रीमद्भगवद्गीता (१८.६६)',
    likesCount: 312,
    bookmarksCount: 154
  }
];

export const fallbackDohas = [
  {
    id: 'doha_1',
    text: 'गुरु गोविन्द दोऊ खड़े, काके लागूं पांय। बलिहारी गुरु आपनो, गोविन्द दियो बताय॥',
    meaning: 'जब गुरु और गोविंद (ईश्वर) दोनों सामने खड़े हों, तो पहले गुरु के चरण स्पर्श करने चाहिए, क्योंकि गुरु ने ही हमें ईश्वर तक पहुँचने का मार्ग दिखाया है।',
    author: 'संत कबीरदास'
  },
  {
    id: 'doha_2',
    text: 'पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोइ। ढाई आखर प्रेम का, पढ़े सो पंडित होइ॥',
    meaning: 'बड़ी-बड़ी पुस्तकें पढ़कर संसार थक गया, पर कोई वास्तविक ज्ञानी नहीं बन सका। जो प्रेम के ढाई अक्षर समझ लेता है, वही सच्चा ज्ञानी है।',
    author: 'संत कबीरदास'
  },
  {
    id: 'doha_3',
    text: 'ऐसी बानी बोलिये, मन का आपा खोये। औरन को शीतल करे, आपहुं शीतल होये॥',
    meaning: 'हमें ऐसी वाणी बोलनी चाहिए जो अहंकार से रहित हो। जो दूसरों को भी प्रसन्नता (शीतलता) दे और स्वयं को भी शांति प्रदान करे।',
    author: 'संत कबीरदास'
  }
];

export const fallbackVideos = [
  {
    id: 'vid_1',
    title: 'Bhagavad Gita - Chapter 2 Complete Explanation',
    description: 'A deep dive into Sankhya Yoga and soul immortality.',
    youtubeId: '2bO60Gz-L5M',
    duration: '45 mins',
    thumbnail: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
    category: 'geeta_upadesh',
    views: 12500
  },
  {
    id: 'vid_2',
    title: 'Hanuman Chalisa Divine Musical',
    description: 'Beautiful, powerful musical rendition of Hanuman Chalisa with translations.',
    youtubeId: 'A7K_M6zS2Z8',
    duration: '10 mins',
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    category: 'bhakti_geet',
    views: 89000
  }
];

export const fallbackCategories = [
  { id: 'geeta_upadesh', name: 'Gita Upadesh (गीता उपदेश)', icon: '📖', description: 'भगवान कृष्ण द्वारा अर्जुन को दिया गया परम दिव्य ज्ञान' },
  { id: 'bhakti_geet', name: 'Bhakti & Chants (भक्ति एवं स्तोत्र)', icon: '🕉', description: 'भगवान के दिव्य नाम संकीर्तन और पावन चालीसा' },
  { id: 'vedic_science', name: 'Vedic Science (वैदिक विज्ञान)', icon: '🪐', description: 'सनातन शास्त्रों का वैज्ञानिक एवं खगोलीय पहलू' }
];

export const fallbackProducts = [
  {
    id: 'prod_1',
    title: 'Srimad Bhagavad Gita As It Is',
    price: 299,
    originalPrice: 450,
    coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
    description: 'Complete Bhagavad Gita with original Sanskrit shlokas, Hindi translation, and elaborate purports.',
    category: 'Books',
    rating: 4.9,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'prod_2',
    title: 'Premium Tulsi Jap Mala (108 Beads)',
    price: 150,
    originalPrice: 250,
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted premium Tulsi wood beads for daily Naam Jap and meditation. Purified and energized.',
    category: 'Pooja Essentials',
    rating: 4.8,
    stock: 120,
    images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'prod_3',
    title: 'Natural Sandalwood Dhoop Batti',
    price: 99,
    originalPrice: 150,
    coverImage: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80',
    description: '100% natural chemical-free pure Chandan incense cones for a pure spiritual environment.',
    category: 'Incense',
    rating: 4.7,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80']
  }
];

export const fallbackAppSettings = [
  {
    id: 'app_config',
    onboardingEnabled: true,
    maintenanceMode: false,
    panchangApiKey: '',
    shareAppMessage: 'Join me on Hari Pathshala App to read divine scriptures and play spiritual quizzes!',
    playStoreUrl: 'https://haripathshala.online',
    appStoreUrl: 'https://haripathshala.online'
  }
];

export const fallbackHomepageSections = [
  { id: 'daily_quote', type: 'daily_quote', title: 'Today\'s Divine Wisdom', isVisible: true, order: 1 },
  { id: 'panchang', type: 'panchang', title: 'Daily Panchang', isVisible: true, order: 2 },
  { id: 'naam_jap', type: 'naam_jap', title: 'Naam Jap Sadhana', isVisible: true, order: 3 },
  { id: 'quiz', type: 'quiz', title: 'Spiritual Quiz Challenge', isVisible: true, order: 4 },
  { id: 'videos', type: 'videos', title: 'Satsang & Teachings', isVisible: true, order: 5 },
  { id: 'products', type: 'products', title: 'Spiritual Bookstore', isVisible: true, order: 6 }
];

export const fallbackNavigation = [
  { id: 'nav_home', label: 'Home', path: '/', icon: 'home', order: 1 },
  { id: 'nav_adhyayan', label: 'Adhyayan', path: '/adhyayan', icon: 'bookOpen', order: 2 },
  { id: 'nav_quiz', label: 'Quiz', path: '/quiz', icon: 'trophy', order: 3 },
  { id: 'nav_chanting', label: 'Naam Jap', path: '/chanting', icon: 'disc', order: 4 },
  { id: 'nav_store', label: 'Pustakalaya', path: '/store', icon: 'shoppingBag', order: 5 }
];

export const fallbackBlogs = [
  {
    id: 'blog_1',
    title: 'The Science Behind Daily Panchang and Tithi Calculations',
    summary: 'Discover how ancient Vedic Rishis formulated high-precision astronomical calculations.',
    content: 'The Vedic calendar, or Panchang, is based on five attributes: Tithi, Vara, Nakshatra, Yoga, and Karana. These represent the scientific position of the Sun and Moon relative to Earth, affecting mental and spiritual energy.',
    coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-07-01'
  }
];

export const fallbackEvents = [
  {
    id: 'event_1',
    title: 'Srimad Bhagavad Gita Shloka Chanting Session',
    dateTime: 'Every Sunday, 5:00 PM IST',
    location: 'Online Zoom / Hari Pathshala App Live',
    coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80',
    description: 'Learn correct Sanskrit pronunciation, swaras, and inner spiritual meanings of Bhagavad Gita verses.'
  }
];

export const fallbackTestimonials = [
  {
    id: 't_1',
    userName: 'Achyutanand Das',
    userCity: 'Vrindavan',
    rating: 5,
    text: 'This app is a divine blessing. The combination of daily Panchang, beautiful Quotes, and the Naam Jap bead counter is exactly what any sadhak needs!'
  },
  {
    id: 't_2',
    userName: 'Radha Priya',
    userCity: 'Ayodhya',
    rating: 5,
    text: 'The spiritual quiz is very educative. It helps me teach my children the golden principles of Ramayana and Mahabharat in a gamified way!'
  }
];

export const fallbackFounder = {
  name: 'Vedic Acharya Swami Atmanand',
  title: 'Founder, Sanatan Vedic Academy',
  bio: 'Swami Atmanand is a scholar of Vedanta and Sanskrit with over 25 years of experience spreading the eternal message of Bhagavad Gita and Ramcharitmanas across the globe.',
  image: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80'
};

export const fallbackPages = {
  about: {
    title: 'About Hari Pathshala',
    content: 'Hari Pathshala is a digital Gurukul dedicated to bringing the pure, unadulterated wisdom of Sanatan Dharma (Vedic literature, Bhagavad Gita, Upanishads, Purana) to the modern generation in a scientifically grounded, interactive, and beautifully accessible format.'
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'Your privacy is sacred to us. Hari Pathshala is committed to protecting your personal data, profile pictures, and spiritual progress. We never sell or share your personal details with third-party tracking corporations.'
  },
  terms: {
    title: 'Terms of Service',
    content: 'By utilizing the Hari Pathshala digital Gurukul, you agree to respect the sacred nature of the scriptures and maintain a helpful, peaceful decorum in the community forums and interactive quizzes.'
  }
};
