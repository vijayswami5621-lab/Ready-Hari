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
    questionsCount: 5,
    points: 50,
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
    questionsCount: 5,
    points: 50,
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
    questionsCount: 9,
    points: 90,
    isPublished: true,
    isTodayQuiz: false
  },
  {
    id: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    name: 'Bala Kanda Leela (बालकाण्ड और राम जन्म)',
    description: 'प्रभु श्रीराम के प्राकट्य, बाल स्वरूप, विश्वामित्र यज्ञ रक्षा और सीता स्वयंवर प्रसंग की अद्भुत लीला।',
    coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
    type: 'chapter',
    timeLimit: 150,
    questionsCount: 6,
    points: 60,
    isPublished: true,
    isTodayQuiz: false
  },
  {
    id: 'hindu_festivals_intro',
    subjectId: 'hindu_dharma',
    name: 'Sanatan Festivals and Calendar (त्योहारों का वैज्ञानिक महत्व)',
    description: 'होली, दीवाली, महाशिवरात्रि जैसे पावन उत्सवों और हिन्दू पंचांग का मौलिक परिचय।',
    coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
    type: 'mixed',
    timeLimit: 90,
    questionsCount: 5,
    points: 50,
    isPublished: true,
    isTodayQuiz: false
  }
];

export const fallbackQuestions: FallbackQuestion[] = [
  {
    id: 'q_gita_new_1',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'भगवद्गीता के प्रथम अध्याय का नाम क्या है जिसमें अर्जुन के मानसिक संघर्ष और विषाद का वर्णन है?',
    type: 'mcq',
    options: [
      'अर्जुनविषादयोग (Arjuna Visada Yoga)',
      'सांख्ययोग (Sankhya Yoga)',
      'कर्मयोग (Karma Yoga)',
      'भक्तियोग (Bhakti Yoga)'
    ],
    correctAnswer: 'अर्जुनविषादयोग (Arjuna Visada Yoga)',
    explanation: 'भगवद्गीता के पहले अध्याय का नाम अर्जुनविषादयोग है, जिसमें कुरुक्षेत्र के मैदान में अपनों को देखकर अर्जुन के मन में उत्पन्न हुए विषाद और संशय का सजीव चित्रण है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '1',
    verse: '1-47'
  },
  {
    id: 'q_gita_new_2',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'श्रीमद्भगवद्गीता में अर्जुन के सारथी के रूप में भगवान श्रीकृष्ण के रथ के ऊपर किस महाप्रतापी देव का ध्वज सुशोभित था?',
    type: 'mcq',
    options: [
      'कपिराज श्री हनुमान जी (Hanuman)',
      'गरुड़ देव (Garuda)',
      'देवराज इंद्र (Indra)',
      'सूर्य देव (Surya)'
    ],
    correctAnswer: 'कपिराज श्री हनुमान जी (Hanuman)',
    explanation: 'महाभारत युद्ध में अर्जुन के रथ के ध्वज पर स्वयं पवनपुत्र हनुमान जी विराजमान थे, इसलिए अर्जुन के रथ को "कपिध्वज" भी कहा जाता है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '1',
    verse: '20'
  },
  {
    id: 'q_gita_new_3',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'गीता के द्वितीय अध्याय के अनुसार, जैसे मनुष्य पुराने वस्त्रों को त्यागकर नए वस्त्र धारण करता है, वैसे ही जीवात्मा किसे त्यागकर नया शरीर धारण करती है?',
    type: 'mcq',
    options: [
      'जीर्ण-शीर्ण शरीर को (Worn-out body)',
      'सांसारिक सुखों को',
      'ज्ञान और बुद्धि को',
      'कर्मों के फलों को'
    ],
    correctAnswer: 'जीर्ण-शीर्ण शरीर को (Worn-out body)',
    explanation: 'अध्याय २, श्लोक २२ में कहा गया है: "वासांसि जीर्णानि यथा विहाय नवानि गृह्णाति नरोऽपराणि। तथा शरीराणि विहाय जीर्णान्यन्यानि संयाति नवानि देही॥"',
    scriptureRef: 'Bhagavad Gita',
    chapter: '2',
    verse: '22'
  },
  {
    id: 'q_gita_new_4',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'भगवद्गीता के तृतीय अध्याय "कर्मयोग" के अनुसार, कौन सा कर्म श्रेष्ठ और बंधनमुक्त करने वाला माना गया है?',
    type: 'mcq',
    options: [
      'निष्काम भाव से लोकसंग्रह हेतु किया गया कर्म',
      'फल की तीव्र लालसा से किया गया कर्म',
      'बिना सोचे-समझे किया गया अकर्म',
      'केवल अपने स्वार्थ की सिद्धि के लिए किया गया कर्म'
    ],
    correctAnswer: 'निष्काम भाव से लोकसंग्रह हेतु किया गया कर्म',
    explanation: 'भगवान श्रीकृष्ण के अनुसार बिना फल की आसक्ति के लोक कल्याण और ईश्वर अर्पण बुद्धि से किया गया निष्काम कर्म ही मनुष्य को बंधनों से मुक्त करता है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '3',
    verse: '19'
  },
  {
    id: 'q_gita_new_5',
    quizId: 'gita_core_knowledge',
    subjectId: 'bhagavad_gita',
    text: 'गीता के अनुसार, काम (वासना), क्रोध और लोभ को किसका द्वार बताया गया है जो आत्मा का पतन करते हैं?',
    type: 'mcq',
    options: [
      'नरक का द्वार (Gateways to Hell)',
      'स्वर्ग का द्वार',
      'मोक्ष का मार्ग',
      'ज्ञान का मार्ग'
    ],
    correctAnswer: 'नरक का द्वार (Gateways to Hell)',
    explanation: 'अध्याय १६, श्लोक २१ के अनुसार, काम, क्रोध और लोभ - ये तीन प्रकार के नरक के द्वार हैं जो जीवात्मा का नाश (अधोगति) करने वाले हैं।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '16',
    verse: '21'
  },
  {
    id: 'q_gita_new_6',
    quizId: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    text: 'भगवान श्रीकृष्ण ने भगवद्गीता के किस अध्याय में अपना अत्यंत अद्भुत और दिव्य "विश्वरूप" अर्जुन को प्रदर्शित किया था?',
    type: 'mcq',
    options: [
      'अध्याय ११ (Chapter 11)',
      'अध्याय २ (Chapter 2)',
      'अध्याय १८ (Chapter 18)',
      'अध्याय ९ (Chapter 9)'
    ],
    correctAnswer: 'अध्याय ११ (Chapter 11)',
    explanation: 'अध्याय ११ में "विश्वरूपदर्शनयोग" के अंतर्गत संजय और अर्जुन भगवान श्रीकृष्ण के कोटि सूर्य समप्रभ विराट विश्वरूप का साक्षात दर्शन करते हैं।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '11',
    verse: '1-55'
  },
  {
    id: 'q_gita_new_7',
    quizId: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    text: 'गीता के चतुर्थ अध्याय के अनुसार, दिव्य ज्ञान को प्राप्त करने का सर्वोत्तम उपाय भगवान ने क्या बताया है?',
    type: 'mcq',
    options: [
      'श्रद्धा, तत्परता और इंद्रिय संयम द्वारा (Faith & Self-control)',
      'अत्यधिक धन के दान द्वारा',
      'कठिन शारीरिक तपस्या द्वारा',
      'शास्त्रों के केवल रटने मात्र से'
    ],
    correctAnswer: 'श्रद्धा, तत्परता और इंद्रिय संयम द्वारा (Faith & Self-control)',
    explanation: 'भगवान कहते हैं: "श्रद्धावांल्लभते ज्ञानं तत्परः संयतेन्द्रियः।" अर्थात जितेंद्रिय, साधनपरायण और श्रद्धालु मनुष्य ही परम ज्ञान को प्राप्त करता है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '4',
    verse: '39'
  },
  {
    id: 'q_gita_new_8',
    quizId: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    text: 'गीता के अनुसार, समस्त विद्याओं में सबसे गुप्त और पवित्र "राजविद्या" किस योग को कहा गया है?',
    type: 'mcq',
    options: [
      'राजविद्याराजगुह्ययोग (अध्याय ९)',
      'सांख्ययोग (अध्याय २)',
      'विभूतियोग (अध्याय १०)',
      'गुणत्रयविभागयोग (अध्याय १४)'
    ],
    correctAnswer: 'राजविद्याराजगुह्ययोग (अध्याय ९)',
    explanation: 'नौवें अध्याय को परम पवित्र, अविनाशी, प्रत्यक्ष फलदायक और सब विद्याओं का राजा "राजविद्या राजगुह्य योग" कहा गया है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '9',
    verse: '2'
  },
  {
    id: 'q_gita_new_9',
    quizId: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    text: 'भगवान श्रीकृष्ण के अनुसार, प्रकृति के वे तीन गुण कौन से हैं जो अविनाशी जीवात्मा को शरीर में बांधते हैं?',
    type: 'mcq',
    options: [
      'सत्त्व, रज और तम (Sattva, Rajas, Tamas)',
      'धर्म, अर्थ और काम',
      'मन, बुद्धि और अहंकार',
      'प्राण, अपान और व्यान'
    ],
    correctAnswer: 'सत्त्व, रज और तम (Sattva, Rajas, Tamas)',
    explanation: 'अध्याय १४, श्लोक ५ के अनुसार, सत्त्वगुण, रजोगुण और तमोगुण - ये प्रकृति से उत्पन्न तीनों गुण इस देह में अविनाशी जीवात्मा को बांधते हैं।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '14',
    verse: '5'
  },
  {
    id: 'q_gita_new_10',
    quizId: 'gita_avatar_intro',
    subjectId: 'bhagavad_gita',
    text: 'गीता के अठारहवें अध्याय के अंत में संजय ने किस परम कल्याणकारी श्लोक के साथ संवाद का उपसंहार किया है?',
    type: 'mcq',
    options: [
      'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः...',
      'सर्वधर्मान्परित्यज्य मामेकं...',
      'कर्मण्येवाधिकारस्ते मा फलेषु...',
      'यदा यदा हि धर्मस्य ग्लानिर्भवति...'
    ],
    correctAnswer: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः...',
    explanation: 'अध्याय १८, श्लोक ७८ (अंतिम श्लोक): "यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः। तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम॥" जहाँ कृष्ण और अर्जुन हैं, वहाँ विजय और नीति निश्चित है।',
    scriptureRef: 'Bhagavad Gita',
    chapter: '18',
    verse: '78'
  },
  {
    id: 'q_rc_new_1',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'श्रीरामचरितमानस के अनुसार, बालकाण्ड के मंगलाचरण में गोस्वामी तुलसीदास जी ने सर्वप्रथम किनकी वंदना की है?',
    type: 'mcq',
    options: [
      'वाणी और विनायक (सरस्वती जी और गणेश जी)',
      'प्रभु श्रीराम और माता सीता',
      'महादेव शिव और माता पार्वती',
      'पवनपुत्र हनुमान जी'
    ],
    correctAnswer: 'वाणी और विनायक (सरस्वती जी और गणेश जी)',
    explanation: 'बालकाण्ड का प्रथम श्लोक है: "वर्णानामर्थसंघानां रसानां छंदसामपि। मंगलानां च कर्त्तारौ वन्दे वाणीविनायकौ॥" यहाँ सरस्वती जी और गणेश जी की वंदना सर्वप्रथम है।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'बालकाण्ड',
    verse: 'श्लोक १'
  },
  {
    id: 'q_rc_new_2',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'मर्यादा पुरुषोत्तम श्रीराम के वनवास काल में भरत जी ने उनके वापस न लौटने पर अयोध्या का शासन किस प्रकार चलाया था?',
    type: 'mcq',
    options: [
      'श्रीराम की चरण पादुकाओं को सिंहासन पर रखकर सेवक के रूप में',
      'स्वयं को अयोध्या का महाराजा घोषित करके',
      'शत्रुघ्न के साथ मिलकर संयुक्त रूप से',
      'मंत्रिपरिषद की पूर्ण अधीनता में रहकर'
    ],
    correctAnswer: 'श्रीराम की चरण पादुकाओं को सिंहासन पर रखकर सेवक के रूप में',
    explanation: 'भरत जी ने चित्रकूट से श्रीराम की चरण पादुकाएं (खड़ाऊँ) लाकर उन्हें सिंहासन पर विराजमान किया और स्वयं नंदीग्राम में तपस्वी की भाँति रहकर १४ वर्ष राज-काज संभाला।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'अयोध्याकाण्ड',
    verse: '३२३-३२५'
  },
  {
    id: 'q_rc_new_3',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'अरण्यकाण्ड के अनुसार, प्रभु श्रीराम ने किस परम शबरी भक्त की कुटिया में जाकर उसके भक्तिभाव से अर्पित किए कंदमूल फल ग्रहण किए थे?',
    type: 'mcq',
    options: [
      'भीलनी शबरी (Shabari)',
      'अहल्या (Ahalya)',
      'अनुसूया (Anasuya)',
      'मंथरा (Manthara)'
    ],
    correctAnswer: 'भीलनी शबरी (Shabari)',
    explanation: 'शबरी ने भक्ति की पराकाष्ठा दिखाते हुए चख-चख कर केवल मीठे बेर प्रभु श्रीराम और लक्ष्मण जी को अर्पित किए, जिसे भगवान ने परम आदर सहित ग्रहण किया।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'अरण्यकाण्ड',
    verse: '३४-३६'
  },
  {
    id: 'q_rc_new_4',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'किष्किन्धाकाण्ड में श्रीराम और सुग्रीव के मध्य अटूट मित्रता स्थापित करवाने में किस महान भक्त की मुख्य भूमिका थी?',
    type: 'mcq',
    options: [
      'श्री हनुमान जी (Hanuman)',
      'नल-नील (Nal-Neel)',
      'जाम्बवन्त (Jambavan)',
      'अंगद (Angad)'
    ],
    correctAnswer: 'श्री हनुमान जी (Hanuman)',
    explanation: 'ऋष्यमूक पर्वत पर हनुमान जी ने विप्र का रूप धरकर श्रीराम-लक्ष्मण से भेंट की और सुग्रीव की परिस्थिति बताकर दोनों के बीच अग्नि को साक्षी मानकर अटूट मित्रता करवाई।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'किष्किन्धाकाण्ड',
    verse: '१-४'
  },
  {
    id: 'q_rc_new_5',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'लंकाकाण्ड में लक्ष्मण जी के मूर्छित होने पर लंका के किस प्रसिद्ध वैद्य को विभीषण की सलाह पर ससम्मान अयोध्या लाया गया था?',
    type: 'mcq',
    options: [
      'वैद्य सुषेण (Sushena)',
      'वैद्य चरक',
      'अश्विनी कुमार',
      'वैद्य धन्वन्तरि'
    ],
    correctAnswer: 'वैद्य सुषेण (Sushena)',
    explanation: 'हनुमान जी लंका से सुषेण वैद्य के घर को ही उठा लाए थे। सुषेण ने लक्ष्मण जी की नाड़ी देखकर द्रोणागिरी पर्वत से संजीवनी बूटी लाने का उपाय बताया था।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'लंकाकाण्ड',
    verse: '५३-५५'
  },
  {
    id: 'q_rc_new_6',
    quizId: 'ram_bal_kand',
    subjectId: 'ramcharitmanas',
    text: 'श्रीरामचरितमानस के अंतिम सोपान "उत्तरकाण्ड" में मुख्यतः किन दो महान चरित्रों के मध्य ज्ञान, भक्ति और कौतुक का संवाद वर्णित है?',
    type: 'mcq',
    options: [
      'कागभुशुण्डि और गरुड़ जी (Kagbhusundi & Garuda)',
      'याज्ञवल्क्य और भारद्वाज',
      'शिव जी और माता पार्वती',
      'तुलसीदास और संत समाज'
    ],
    correctAnswer: 'कागभुशुण्डि और गरुड़ जी (Kagbhusundi & Garuda)',
    explanation: 'उत्तरकाण्ड में काकभुशुण्डि जी ने गरुड़ जी के संशयों को दूर करने के लिए उन्हें रामकथा सुनाई और ज्ञान-भक्ति के रहस्यमयी अंतर को अत्यंत सरल रूप में स्पष्ट किया।',
    scriptureRef: 'Ramcharitmanas',
    chapter: 'उत्तरकाण्ड',
    verse: '५६-१२०'
  },
  {
    id: 'q_hc_new_1',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: 'हनुमान चालीसा के मंगलाचरण के अनुसार, मन के दर्पण को स्वच्छ करने के लिए गुरु के किन पावन तत्वों की धूलि ग्रहण की जाती है?',
    type: 'mcq',
    options: [
      'श्री गुरु चरण सरोज रज (Dust of Guru\'s Lotus Feet)',
      'गंगा जल का जल कण',
      'चंदन की पावन धूलि',
      'यज्ञवेदी की पवित्र भस्म'
    ],
    correctAnswer: 'श्री गुरु चरण सरोज रज (Dust of Guru\'s Lotus Feet)',
    explanation: 'हनुमान चालीसा का पहला दोहा है: "श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि।" अर्थात श्री गुरुदेव के चरण कमलों की धूलि से अपने मन रूपी दर्पण को पवित्र करके...',
    scriptureRef: 'Hanuman Chalisa',
    chapter: 'मंगलाचरण',
    verse: 'दोहा १'
  },
  {
    id: 'q_hc_new_2',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: '"राम दुआरे तुम रखवारे। होत न आज्ञा बिनु पैसारे॥" इस चौपाई का आध्यात्मिक रहस्य क्या है?',
    type: 'mcq',
    options: [
      'प्रभु श्रीराम की कृपा प्राप्ति के लिए हनुमान जी का आश्रय आवश्यक है',
      'अयोध्या के मुख्य द्वार पर हनुमान जी पहरा देते थे',
      'यमराज बिना हनुमान जी की अनुमति के नहीं आ सकते',
      'राम दरबार में केवल वानर सेना ही जा सकती थी'
    ],
    correctAnswer: 'प्रभु श्रीराम की कृपा प्राप्ति के लिए हनुमान जी का आश्रय आवश्यक है',
    explanation: 'हनुमान जी प्रभु श्रीराम के हृदय के रक्षक हैं। उनकी आज्ञा या कृपा के बिना कोई भी भक्त श्रीराम के परम पद (शरण) को प्राप्त नहीं कर सकता।',
    scriptureRef: 'Hanuman Chalisa',
    chapter: 'चौपाई',
    verse: '२१'
  },
  {
    id: 'q_hc_new_3',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: 'हनुमान जी के कानों में सुंदर कुंडल और सिर पर घुँघराले बालों की अनुपम शोभा का वर्णन चालीसा की किस चौपाई में मिलता है?',
    type: 'mcq',
    options: [
      'कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥',
      'हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेऊ साजै॥',
      'शंकर सुवन केसरी नंदन। तेज प्रताप महा जग बंदन॥',
      'बिद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥'
    ],
    correctAnswer: 'कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥',
    explanation: 'हनुमान जी स्वर्ण के समान कांतिमान वर्ण वाले हैं, कानों में सुंदर कुंडल धारण किए हुए हैं और उनके सिर के बाल घुँघराले (कुंचित) हैं।',
    scriptureRef: 'Hanuman Chalisa',
    chapter: 'चौपाई',
    verse: '५'
  },
  {
    id: 'q_hc_new_4',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'hanuman_chalisa',
    text: '"सब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥" इस चौपाई के अनुसार तपस्वी राजा श्रीराम के सभी कार्यों को किसने सिद्ध किया?',
    type: 'mcq',
    options: [
      'वीर हनुमान जी ने (Hanuman)',
      'महाराज सुग्रीव ने',
      'लंकापति विभीषण ने',
      'ऋषि वशिष्ठ ने'
    ],
    correctAnswer: 'वीर हनुमान जी ने (Hanuman)',
    explanation: 'प्रभु श्रीराम सभी तपस्वियों के राजा हैं और उनके कठिन से कठिन कार्यों को भी वीर हनुमान जी ने अत्यंत सहज भाव से पूर्ण किया।',
    scriptureRef: 'Hanuman Chalisa',
    chapter: 'चौपाई',
    verse: '२७'
  },
  {
    id: 'q_sk_new_1',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'sunderkand',
    text: 'सुन्दरकाण्ड के प्रारंभ में हनुमान जी जब विशाल समुद्र लांघ रहे थे, तब देवों ने उनकी बुद्धि की परीक्षा के लिए किस सर्पमाता को भेजा था?',
    type: 'mcq',
    options: [
      'सुरसा (Surasa)',
      'सिंहिका (Sinhika)',
      'कद्रू (Kadru)',
      'त्रिजटा (Trijata)'
    ],
    correctAnswer: 'सुरसा (Surasa)',
    explanation: 'सुरसा ने हनुमान जी का मार्ग रोककर उन्हें ग्रास बनाने की चेष्टा की। हनुमान जी ने अपनी बुद्धि के बल पर लघु रूप धरकर उसके मुख में प्रवेश कर बाहर आकर उसे संतुष्ट किया।',
    scriptureRef: 'Sunderkand',
    chapter: 'दोहा २-४'
  },
  {
    id: 'q_sk_new_2',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'sunderkand',
    text: 'लंका में माता सीता की खोज करते समय हनुमान जी को लंका के किस महल के ऊपर "हरि मंदिर" अंकित दिखाई दिया था जहाँ तुलसी का पौधा भी सुशोभित था?',
    type: 'mcq',
    options: [
      'विभीषण का भवन (Vibhishana\'s Palace)',
      'रावण का मुख्य महल',
      'अशोक वाटिका की कुटिया',
      'कुम्भकर्ण का शयनकक्ष'
    ],
    correctAnswer: 'विभीषण का भवन (Vibhishana\'s Palace)',
    explanation: 'हनुमान जी ने देखा: "रामायुध अंकित गृह सोभा बरनि न जाइ। नव तुलसी का बृन्द तहँ देखि हरष कपिराइ॥" विभीषण का गृह राम-नाम से सुशोभित था।',
    scriptureRef: 'Sunderkand',
    chapter: 'दोहा ५'
  },
  {
    id: 'q_sk_new_3',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'sunderkand',
    text: 'अशोक वाटिका में जब रावण माता सीता को डरा रहा था, तब किस राक्षसी ने सीता जी को सांत्वना दी और अपना शुभ स्वप्न सुनाया था?',
    type: 'mcq',
    options: [
      'त्रिजटा (Trijata)',
      'शूर्पणखा (Surpanakha)',
      'ताड़का (Tadaka)',
      'मंदोदरी (Mandodari)'
    ],
    correctAnswer: 'त्रिजटा (Trijata)',
    explanation: 'त्रिजटा एक विवेकशील राक्षसी थी, जिसने स्वप्न में लंका दहन और श्रीराम की विजय देखी थी। उसने राक्षसियों को सीता जी की शरण में जाने की सलाह दी।',
    scriptureRef: 'Sunderkand',
    chapter: 'दोहा ११-१२'
  },
  {
    id: 'q_sk_new_4',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'sunderkand',
    text: 'सुन्दरकाण्ड के अनुसार, हनुमान जी ने अशोक वाटिका का विध्वंस करते हुए रावण के किस प्रतापी कनिष्ठ पुत्र का वध किया था?',
    type: 'mcq',
    options: [
      'अक्षय कुमार (Akshaya Kumar)',
      'मेघनाद (Meghnad)',
      'अतिकाय (Atikaya)',
      'त्रिशिरा (Trishira)'
    ],
    correctAnswer: 'अक्षय कुमार (Akshaya Kumar)',
    explanation: 'रावण ने हनुमान जी को पकड़ने के लिए अपने छोटे पुत्र अक्षय कुमार को भेजा, जिसे हनुमान जी ने वृक्ष की मार से युद्धभूमि में मार गिराया।',
    scriptureRef: 'Sunderkand',
    chapter: 'दोहा १७-१८'
  },
  {
    id: 'q_sk_new_5',
    quizId: 'hanuman_chalisa_basic',
    subjectId: 'sunderkand',
    text: 'लंका दहन के पश्चात जब हनुमान जी समुद्र पार कर वापस लौटे, तब उन्होंने सीता माता द्वारा दी गई किस अमूल्य निशानी को प्रभु श्रीराम के हाथों में सौंपा था?',
    type: 'mcq',
    options: [
      'चूड़ामणि (Chudamani)',
      'स्वर्ण कंगन (Golden Bangle)',
      'दिव्य माला (Divine Garland)',
      'रत्नजड़ित अंगूठी (Ring)'
    ],
    correctAnswer: 'चूड़ामणि (Chudamani)',
    explanation: 'सीता जी ने हनुमान जी को अपने सिर की अमूल्य आभूषण "चूड़ामणि" देकर विदा किया था। इसे देखकर प्रभु श्रीराम भावुक हो गए थे।',
    scriptureRef: 'Sunderkand',
    chapter: 'दोहा ३१-३२'
  },
  {
    id: 'q_sp_new_1',
    quizId: 'hindu_festivals_intro',
    subjectId: 'shiv_puran',
    text: 'शिव पुराण के अनुसार, भगवान शिव की आराधना में प्रयुक्त होने वाले किस पावन मनके को साक्षात रुद्र के आंसुओं से उत्पन्न माना गया है?',
    type: 'mcq',
    options: [
      'रुद्राक्ष (Rudraksha)',
      'तुलसी माला (Tulsi)',
      'स्फटिक (Sphatik)',
      'कमलगट्टा (Kamalgatta)'
    ],
    correctAnswer: 'रुद्राक्ष (Rudraksha)',
    explanation: 'शिव पुराण के अनुसार, कल्याण के लिए वर्षों की समाधि के बाद जब शिव जी ने नेत्र खोले, तो उनके आंसुओं की बूंदें पृथ्वी पर गिरीं जिनसे रुद्राक्ष के वृक्ष उत्पन्न हुए।',
    scriptureRef: 'Shiva Purana',
    chapter: 'विद्येश्वर संहिता',
    verse: 'अध्याय २५'
  },
  {
    id: 'q_sp_new_2',
    quizId: 'hindu_festivals_intro',
    subjectId: 'shiv_puran',
    text: 'शिवजी के परम पावन १२ ज्योतिर्लिंगों में से सर्वप्रथम और परम पूजनीय ज्योतिर्लिंग भारत के किस राज्य के तट पर स्थित है?',
    type: 'mcq',
    options: [
      'सोमनाथ - गुजरात (Somnath - Gujarat)',
      'काशी विश्वनाथ - उत्तर प्रदेश',
      'केदारनाथ - उत्तराखंड',
      'महाकालेश्वर - मध्य प्रदेश'
    ],
    correctAnswer: 'सोमनाथ - गुजरात (Somnath - Gujarat)',
    explanation: 'द्वादश ज्योतिर्लिंगों में "सोमनाथ" सर्वप्रथम ज्योतिर्लिंग है जो गुजरात के सौराष्ट्र क्षेत्र के समुद्र तट पर विराजमान है।',
    scriptureRef: 'Shiva Purana',
    chapter: 'कोटिरुद्र संहिता',
    verse: 'अध्याय १४'
  },
  {
    id: 'q_ds_new_1',
    quizId: 'hindu_festivals_intro',
    subjectId: 'durga_saptashati',
    text: 'दुर्गा सप्तशती के अनुसार, माँ आदिशक्ति जगदम्बा ने देवताओं के कष्ट दूर करने के लिए किस महाभयानक महिष-असुर का मर्दन किया था?',
    type: 'mcq',
    options: [
      'महिषासुर (Mahishasura)',
      'रक्तबीज (Raktabija)',
      'मधु-कैटभ (Madhu-Kaitabha)',
      'शुम्भ-निशुम्भ'
    ],
    correctAnswer: 'महिषासुर (Mahishasura)',
    explanation: 'दुर्गा सप्तशती के मध्यम चरित्र में देवी ने महिषासुर (भैंसे के रूप वाले असुर) का संहार कर चराचर जगत को उसके आतंक से मुक्त किया था, जिससे वे "महिषासुरमर्दिनी" कहलाईं।',
    scriptureRef: 'Durga Saptashati',
    chapter: 'अध्याय ३'
  },
  {
    id: 'q_ds_new_2',
    quizId: 'hindu_festivals_intro',
    subjectId: 'durga_saptashati',
    text: 'दुर्गा सप्तशती के उत्तर चरित्र के अनुसार, किस असुर की रक्त की प्रत्येक बूंद के भूमि पर गिरने से नया असुर उत्पन्न हो जाता था, जिसका चामुण्डा देवी ने संहार किया?',
    type: 'mcq',
    options: [
      'रक्तबीज (Raktabija)',
      'चण्ड-मुण्ड (Chanda-Munda)',
      'धूम्रलोचन (Dhumralochana)',
      'निशुम्भ (Nishumbha)'
    ],
    correctAnswer: 'रक्तबीज (Raktabija)',
    explanation: 'रक्तबीज को यह वरदान था। माँ काली ने उसका रक्त भूमि पर गिरने से पहले अपने खप्पर में भर लिया और उसे पी लिया, जिससे उसका सर्वनाश संभव हुआ।',
    scriptureRef: 'Durga Saptashati',
    chapter: 'अध्याय ८'
  },
  {
    id: 'q_gk_new_1',
    quizId: 'hindu_festivals_intro',
    subjectId: 'indian_culture',
    text: 'सनातन धर्म के चार महान पुरुषार्थ कौन से हैं जो जीवन के चार चरम लक्ष्यों को अभिव्यक्त करते हैं?',
    type: 'mcq',
    options: [
      'धर्म, अर्थ, काम और मोक्ष (Dharma, Artha, Kama, Moksha)',
      'सत्य, अहिंसा, तप और शौच',
      'ब्रह्मचर्य, गृहस्थ, वानप्रस्थ और संन्यास',
      'ऋग्वेद, यजुर्वेद, सामवेद और अथर्ववेद'
    ],
    correctAnswer: 'धर्म, अर्थ, काम और मोक्ष (Dharma, Artha, Kama, Moksha)',
    explanation: 'मानव जीवन के सर्वांगीण विकास के लिए चार पुरुषार्थों की व्यवस्था की गई है: धर्म (कर्तव्य), अर्थ (साधन), काम (इच्छाएं) और मोक्ष (परम मुक्ति)।',
    scriptureRef: 'General Spiritual Knowledge',
    chapter: 'जीवन मूल्य'
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
  },
  {
    id: 'official_details',
    founderName: "Ajay Swami (Amar Das)",
    founderDesignation: "Founder & CEO",
    organizationName: "Hari Pathshala",
    tagline: "ज्ञान • भक्ति • संस्कार",
    founderMessage: "Hari Pathshala is dedicated to making the timeless wisdom of Sanatan Dharma accessible through modern technology while preserving the authenticity of our sacred scriptures.",
    website: "https://haripathshala.online",
    instagram: "https://www.instagram.com/hari_pathshala?igsh=MXMxZG5kd3h6aTRpdQ==",
    logo: "/logo.png",
    founderPhoto: "/founder.png"
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
