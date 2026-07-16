export interface Chapter {
  id: string;
  number: number;
  nameEnglish: string;
  nameHindi: string;
  descriptionEnglish: string;
  descriptionHindi: string;
}

export const SUBJECT_CHAPTERS: Record<string, Chapter[]> = {
  bhagavad_gita: Array.from({ length: 18 }, (_, i) => {
    const names = [
      { eng: "Arjuna Visada Yoga", hin: "अर्जुनविषादयोग", descEng: "Arjuna's Dilemma and Grief", descHin: "अर्जुन का विषाद और मानसिक असमंजस" },
      { eng: "Sankhya Yoga", hin: "सांख्ययोग", descEng: "The Yoga of Analytical Knowledge", descHin: "आत्मा का अमरत्व और ज्ञानयोग" },
      { eng: "Karma Yoga", hin: "कर्मयोग", descEng: "The Yoga of Action", descHin: "निष्काम कर्म करने का दिव्य सिद्धांत" },
      { eng: "Jnana Karma Sanyasa Yoga", hin: "ज्ञानकर्मसंन्यासयोग", descEng: "The Yoga of Knowledge and Renunciation of Action", descHin: "दिव्य ज्ञान और कर्म यज्ञ" },
      { eng: "Karma Sanyasa Yoga", hin: "कर्मसंन्यासयोग", descEng: "The Yoga of Action and Renunciation", descHin: "कर्म संन्यास और आत्म-संयम" },
      { eng: "Dhyana Yoga", hin: "आत्मसंयमयोग", descEng: "The Yoga of Meditation", descHin: "ध्यान और मन को वश में करने की कला" },
      { eng: "Jnana Vijnana Yoga", hin: "ज्ञानविज्ञानयोग", descEng: "The Yoga of Wisdom and Realization", descHin: "ईश्वर का दिव्य स्वरूप और प्रकृति" },
      { eng: "Aksara Brahma Yoga", hin: "अक्षरब्रह्मयोग", descEng: "The Yoga of the Imperishable Brahman", descHin: "अविनाशी परब्रह्म का ध्यान और अंतकाल" },
      { eng: "Raja Vidya Raja Guhya Yoga", hin: "राजविद्याराजगुह्ययोग", descEng: "The Yoga of Sovereign Science and Secret", descHin: "परम गोपनीय ज्ञान और ईश्वरीय भक्ति" },
      { eng: "Vibhuti Yoga", hin: "विभूतियोग", descEng: "The Yoga of Divine Manifestations", descHin: "भगवान की असीम विभूतियाँ और ऐश्वर्य" },
      { eng: "Visvarupa Darsana Yoga", hin: "विश्वरूपदर्शनयोग", descEng: "The Yoga of the Vision of the Cosmic Form", descHin: "श्रीकृष्ण का विराट विश्वरूप दर्शन" },
      { eng: "Bhakti Yoga", hin: "भक्तियोग", descEng: "The Yoga of Devotion", descHin: "सच्चे भक्त के लक्षण और पराभक्ति" },
      { eng: "Ksetra Ksetrajna Vibhaga Yoga", hin: "क्षेत्रक्षेत्रज्ञविभागयोग", descEng: "The Yoga of Field and Knower of the Field", descHin: "शरीर (क्षेत्र) और आत्मा (क्षेत्रज्ञ) का भेद" },
      { eng: "Gunatraya Vibhaga Yoga", hin: "गुणत्रयविभागयोग", descEng: "The Yoga of Three Gunas of Nature", descHin: "सत्व, रज और तम गुणों की व्याख्या" },
      { eng: "Purusottama Yoga", hin: "पुरुषोत्तमयोग", descEng: "The Yoga of the Supreme Divine Personality", descHin: "संसार रूपी अश्वत्थ वृक्ष और पुरुषोत्तम स्वरूप" },
      { eng: "Daivasura Sampad Vibhaga Yoga", hin: "दैवासुरसम्पद्विभागयोग", descEng: "The Yoga of Divine and Demoniac Natures", descHin: "दैवीय और आसुरी प्रवृत्तियों का अंतर" },
      { eng: "Sraddhatraya Vibhaga Yoga", hin: "श्रद्धात्रयविभागयोग", descEng: "The Yoga of Threefold Faith", descHin: "आहार, यज्ञ, तप और दान में तीन प्रकार की श्रद्धा" },
      { eng: "Moksa Sanyasa Yoga", hin: "मोक्षसंन्यासयोग", descEng: "The Yoga of Liberation and Renunciation", descHin: "त्याग का वास्तविक अर्थ और मोक्ष की प्राप्ति" }
    ];
    return {
      id: `chapter_${i + 1}`,
      number: i + 1,
      nameEnglish: `Chapter ${i + 1}: ${names[i].eng}`,
      nameHindi: `अध्याय ${i + 1}: ${names[i].hin}`,
      descriptionEnglish: names[i].descEng,
      descriptionHindi: names[i].descHin
    };
  }),

  ramcharitmanas: [
    { id: "chapter_1", number: 1, nameEnglish: "Bala Kanda", nameHindi: "बालकाण्ड", descriptionEnglish: "Rama's childhood, birth, and marriage", descriptionHindi: "प्रभु श्रीराम का अवतार, बाल्यकाल और सीता स्वयंवर" },
    { id: "chapter_2", number: 2, nameEnglish: "Ayodhya Kanda", nameHindi: "अयोध्याकाण्ड", descriptionEnglish: "Preparations for coronation and exile", descriptionHindi: "श्रीराम वनगमन, भरत मिलाप और केवट प्रसंग" },
    { id: "chapter_3", number: 3, nameEnglish: "Aranya Kanda", nameHindi: "अरण्यकाण्ड", descriptionEnglish: "Life in forest, Panchavati, and Sita's abduction", descriptionHindi: "अरण्य जीवन, शूर्पणखा प्रसंग, और सीता हरण" },
    { id: "chapter_4", number: 4, nameEnglish: "Kishkindha Kanda", nameHindi: "किष्किन्धाकाण्ड", descriptionEnglish: "Alliance with Sugriva and search for Sita", descriptionHindi: "सुग्रीव मित्रता, बाली वध और हनुमान-श्रीराम मिलाप" },
    { id: "chapter_5", number: 5, nameEnglish: "Sundara Kanda", nameHindi: "सुन्दरकाण्ड", descriptionEnglish: "Hanuman's journey to Lanka, meeting Sita, and burning Lanka", descriptionHindi: "हनुमान जी की लंका यात्रा, सीता माता से भेंट और लंका दहन" },
    { id: "chapter_6", number: 6, nameEnglish: "Lanka Kanda", nameHindi: "लंकाकाण्ड", descriptionEnglish: "The war in Lanka and defeat of Ravana", descriptionHindi: "राम-रावण महायुद्ध, लक्ष्मण शक्ति और रावण वध" },
    { id: "chapter_7", number: 7, nameEnglish: "Uttara Kanda", nameHindi: "उत्तरकाण्ड", descriptionEnglish: "Return to Ayodhya, coronation, and teachings", descriptionHindi: "श्रीराम का राज्याभिषेक, रामराज्य और कागभुशुण्डि संवाद" }
  ],

  ramayana: [
    { id: "chapter_1", number: 1, nameEnglish: "Bala Kanda", nameHindi: "बालकाण्ड", descriptionEnglish: "Birth of Rama, Vishwamitra's quest, and Mithila marriage", descriptionHindi: "श्रीराम जन्म कथा, ताड़का वध, अहल्या उद्धार और स्वयंवर" },
    { id: "chapter_2", number: 2, nameEnglish: "Ayodhya Kanda", nameHindi: "अयोध्याकाण्ड", descriptionEnglish: "Kaikeyi's boons, Dasharatha's grief, and Rama's departure", descriptionHindi: "कैकेयी के वरदान, दशरथ मरण और चित्रकूट निवास" },
    { id: "chapter_3", number: 3, nameEnglish: "Aranya Kanda", nameHindi: "अरण्यकाण्ड", descriptionEnglish: "Forest wanderings, sages, and Golden Deer chase", descriptionHindi: "दंडकारण्य वास, जटायु प्रसंग और मारीच वध" },
    { id: "chapter_4", number: 4, nameEnglish: "Kishkindha Kanda", nameHindi: "किष्किन्धाकाण्ड", descriptionEnglish: "Pampa lake, Sugriva's coronation, and search parties", descriptionHindi: "ऋष्यमूक पर्वत निवास, तारा विलाप और वानर सेना प्रस्थान" },
    { id: "chapter_5", number: 5, nameEnglish: "Sundara Kanda", nameHindi: "सुन्दरकाण्ड", descriptionEnglish: "Hanuman's heroic feats, Ashoka Vatika, and challenge to Ravana", descriptionHindi: "हनुमान जी की भक्ति, सीता संताप और लंका दहन" },
    { id: "chapter_6", number: 6, nameEnglish: "Yuddha Kanda", nameHindi: "युद्धकाण्ड", descriptionEnglish: "Building Ram Setu, the epic war, and Vibhishana's coronation", descriptionHindi: "समुद्र सेतु निर्माण, लंका का महायुद्ध और विभीषण राज्याभिषेक" },
    { id: "chapter_7", number: 7, nameEnglish: "Uttara Kanda", nameHindi: "उत्तरकाण्ड", descriptionEnglish: "Luv-Kush story, Sita's return to Earth, and Rama's departure", descriptionHindi: "लव-कुश जन्म, अश्वमेध यज्ञ और प्रभु धाम गमन" }
  ],

  mahabharata: [
    { id: "chapter_1", number: 1, nameEnglish: "Adi Parva & Sabha Parva", nameHindi: "आदि और सभा पर्व", descriptionEnglish: "Origins, Kuru ancestry, and the dice game", descriptionHindi: "कौरव-पांडव जन्म, लाक्षागृह और द्यूत क्रीड़ा प्रसंग" },
    { id: "chapter_2", number: 2, nameEnglish: "Vana Parva & Virata Parva", nameHindi: "वन और विराट पर्व", descriptionEnglish: "Exile in forest and incognito life", descriptionHindi: "पांडवों का वनवास, यक्ष प्रश्न और अज्ञातवास की अवधि" },
    { id: "chapter_3", number: 3, nameEnglish: "Udyoga Parva & Bhishma Parva", nameHindi: "उद्योग और भीष्म पर्व", descriptionEnglish: "Peace missions and Bhishma's generalship", descriptionHindi: "कृष्ण दूत प्रसंग, युद्ध की तैयारी और भीष्म शरशय्या" },
    { id: "chapter_4", number: 4, nameEnglish: "Drona Parva & Karna Parva", nameHindi: "द्रोण और कर्ण पर्व", descriptionEnglish: "Abhimanyu's bravery, fall of Drona and Karna", descriptionHindi: "चक्रव्यूह भेदन, अभिमन्यु वीरगति और कर्ण वध" },
    { id: "chapter_5", number: 5, nameEnglish: "Shalya Parva to Stri Parva", nameHindi: "शल्य से स्त्री पर्व", descriptionEnglish: "Duryodhana's defeat, Ashwatthama's revenge, and grief", descriptionHindi: "गदा युद्ध, दुर्योधन वध और गांधारी का विलाप व शाप" },
    { id: "chapter_6", number: 6, nameEnglish: "Shanti Parva to Swargarohana", nameHindi: "शांति से स्वर्गारोहण पर्व", descriptionEnglish: "Yudhishthira's coronation, Bhishma's teachings, and ascension", descriptionHindi: "भीष्म पितामह का अंतिम उपदेश, युधिष्ठिर राज्याभिषेक और स्वर्ग यात्रा" }
  ],

  hanuman_chalisa: [
    { id: "chapter_1", number: 1, nameEnglish: "Part 1: Invocation & First 20 Verses", nameHindi: "भाग १: मंगलाचरण एवं प्रथम २० चौपाइयाँ", descriptionEnglish: "Praise of Hanuman's attributes and Rama bhakti", descriptionHindi: "हनुमान जी के अतुलित बल, बुद्धि, और ज्ञान का स्तुति गान" },
    { id: "chapter_2", number: 2, nameEnglish: "Part 2: Verses 21 to 40 & Concluding Doha", nameHindi: "भाग २: चौपाई २१ से ४० एवं समापन दोहा", descriptionEnglish: "Protection from negative forces and grace of Hanuman", descriptionHindi: "संकटों का निवारण, अष्टसिद्धि-नवनिधि की चर्चा और गुरु रूप कृपा" }
  ],

  sunderkand: [
    { id: "chapter_1", number: 1, nameEnglish: "The Epic Quest Begins", nameHindi: "यात्रा आरम्भ और सुरसा प्रसंग", descriptionEnglish: "Hanuman's flight across ocean and obstacles", descriptionHindi: "हनुमान जी का समुद्र लांघना, सुरसा और सिंहिका पर विजय" },
    { id: "chapter_2", number: 2, nameEnglish: "Searching Ashoka Vatika", nameHindi: "अशोक वाटिका की खोज", descriptionEnglish: "Meeting Vibhishana and locating Sita", descriptionHindi: "विभीषण मिलाप, अशोक वाटिका प्रवेश और सीता माता के दर्शन" },
    { id: "chapter_3", number: 3, nameEnglish: "The Burning of Lanka", nameHindi: "रावण संवाद और लंका दहन", descriptionEnglish: "Akshaya Kumar's end, Ravana's court, and flame", descriptionHindi: "अक्षय कुमार वध, रावण दरबार में सिंहनाद और लंका दहन" }
  ],

  durga_saptashati: [
    { id: "chapter_1", number: 1, nameEnglish: "Prathama Charitra", nameHindi: "प्रथम चरित्र", descriptionEnglish: "Slaying of Madhu and Kaitabha", descriptionHindi: "भगवती महाकाली की महिमा, मधु-कैटभ वध प्रसंग" },
    { id: "chapter_2", number: 2, nameEnglish: "Madhyama Charitra", nameHindi: "मध्यम चरित्र", descriptionEnglish: "Defeat of Mahishasura", descriptionHindi: "महिषासुर की सेना का संहार और महिषासुर मर्दिनी लीला" },
    { id: "chapter_3", number: 3, nameEnglish: "Uttara Charitra", nameHindi: "उत्तर चरित्र", descriptionEnglish: "Slaying of Shumbha and Nishumbha", descriptionHindi: "चण्ड-मुण्ड वध, रक्तबीज संहार और शुम्भ-निशुम्भ वध" }
  ],

  shiv_puran: [
    { id: "chapter_1", number: 1, nameEnglish: "Vidyesvara Samhita", nameHindi: "विद्येश्वर संहिता", descriptionEnglish: "Duty of chanting Shiva's name and Rudraksha", descriptionHindi: "शिव पूजा का वैज्ञानिक महत्व, रुद्राक्ष और भस्म धारण विधि" },
    { id: "chapter_2", number: 2, nameEnglish: "Rudra Samhita (Sati & Parvati)", nameHindi: "रुद्र संहिता (सती और पार्वती खण्ड)", descriptionEnglish: "Incarnation of Sati, marriage of Shiva-Parvati", descriptionHindi: "माता सती का आत्मदाह, पार्वती तपस्या और शिव-पार्वती विवाह" },
    { id: "chapter_3", number: 3, nameEnglish: "Sata & Koti Rudra Samhita", nameHindi: "शत और कोटि रुद्र संहिता", descriptionEnglish: "Incarnations of Shiva and the 12 Jyotirlingas", descriptionHindi: "शिव जी के अवतारों की लीलाएँ और १२ ज्योतिर्लिंगों की महिमा" },
    { id: "chapter_4", number: 4, nameEnglish: "Uma & Kailasa Samhita", nameHindi: "उमा और कैलास संहिता", descriptionEnglish: "Esoteric yoga and nature of cosmic energy", descriptionHindi: "माँ उमा की लीला, शिव तत्व ज्ञान और कैलास पर्वत दर्शन" }
  ],

  vishnu_puran: [
    { id: "chapter_1", number: 1, nameEnglish: "Part 1: Creation & Dhruva-Prahlada", nameHindi: "प्रथम अंश: सृष्टि रचना और ध्रुव-प्रह्लाद", descriptionEnglish: "Cosmology and stories of great devotees", descriptionHindi: "सृष्टि उत्पत्ति का विज्ञान, ध्रुव चरित्र और प्रह्लाद की भक्ति" },
    { id: "chapter_2", number: 2, nameEnglish: "Part 2: Geography & Solar System", nameHindi: "द्वितीय अंश: भूगोल और खगोल शास्त्र", descriptionEnglish: "The earth, continents, planets, and sun transit", descriptionHindi: "सप्त द्वीप, पाताल लोक और ग्रहों की चाल का वर्णन" },
    { id: "chapter_3", number: 3, nameEnglish: "Part 3: Vedas, Castes & Shraddha", nameHindi: "तृतीय अंश: वेद विभाजन और वर्णाश्रम धर्म", descriptionEnglish: "Division of Vedas and moral duty guidelines", descriptionHindi: "वेद व्यास जी का अवतरण, सदाचार नियम और श्राद्ध कर्म" },
    { id: "chapter_4", number: 4, nameEnglish: "Part 4: Dynasties of Kings", nameHindi: "चतुर्थ अंश: सूर्य और चंद्र वंश", descriptionEnglish: "Lineage of Solar and Lunar dynasties", descriptionHindi: "इक्ष्वाकु, यदु, कुरु आदि प्रमुख राजवंशों की वंशावली" },
    { id: "chapter_5", number: 5, nameEnglish: "Part 5: Lord Krishna's Avatara", nameHindi: "पंचम अंश: श्रीकृष्ण लीला", descriptionEnglish: "Birth and divine pastimes of Krishna", descriptionHindi: "गोकुल-वृंदावन लीला, कंस वध और द्वारका निर्माण" }
  ],

  bhagavatam: [
    { id: "chapter_1", number: 1, nameEnglish: "Canto 1 & 2: Creation & Cosmic Form", nameHindi: "प्रथम एवं द्वितीय स्कंध: विराट स्वरूप", descriptionEnglish: "Narada's instruction, Parikshit's vow", descriptionHindi: "श्रीमद्भागवत का आरम्भ, परीक्षित-शुकदेव संवाद" },
    { id: "chapter_2", number: 2, nameEnglish: "Canto 3 & 4: Status Quo & Incarnations", nameHindi: "तृतीय एवं चतुर्थ स्कंध: वराह-कपिल लीला", descriptionEnglish: "Varaha avatara, Kapila's Sankhya philosophy", descriptionHindi: "भगवान वराह अवतार, कपिल मुनी का सांख्य उपदेश" },
    { id: "chapter_3", number: 3, nameEnglish: "Canto 5 to 7: Prahlada & Cosmic Worlds", nameHindi: "पंचम से सप्तम स्कंध: भक्त प्रह्लाद", descriptionEnglish: "Universe geography, Prahlada's trials, Narasimha", descriptionHindi: "नृसिंह अवतार, प्रह्लाद भक्ति का दिव्य उपदेश" },
    { id: "chapter_4", number: 4, nameEnglish: "Canto 8 & 9: Samudra Manthan & Dynasties", nameHindi: "अष्टम एवं नवम स्कंध: समुद्र मंथन", descriptionEnglish: "Churning of ocean, Vamana avatara, Rama's line", descriptionHindi: "अमृत मंथन, वामन अवतार और राम-चंद्र वंश लीला" },
    { id: "chapter_5", number: 5, nameEnglish: "Canto 10: Lord Krishna's Divine Leelas", nameHindi: "दशम स्कंध: श्रीकृष्ण लीला सागर", descriptionEnglish: "Detailed pastimes of Gopal, Gopis, and Dwarkadhish", descriptionHindi: "बाल कृष्ण माखनचोरी, कालिया दमन और महारास लीला" },
    { id: "chapter_6", number: 6, nameEnglish: "Canto 11 & 12: Uddhava Gita & Kali Yuga", nameHindi: "एकादश एवं द्वादश स्कंध: उद्धव गीता", descriptionEnglish: "Krishna's final discourse, predictions of Kali Yuga", descriptionHindi: "उद्धव गीता का दिव्य उपदेश और कलयुग के धर्म" }
  ],

  vedas: [
    { id: "chapter_1", number: 1, nameEnglish: "Rigveda (ऋग्वेद)", nameHindi: "ऋग्वेद संहिता", descriptionEnglish: "Mandalas, prayers to fire, rain, and universe creators", descriptionHindi: "विश्व का प्राचीनतम ग्रंथ, गायत्री मंत्र और प्राकृतिक देव स्तुति" },
    { id: "chapter_2", number: 2, nameEnglish: "Yajurveda (यजुर्वेद)", nameHindi: "यजुर्वेद संहिता", descriptionEnglish: "Formulations of rituals, sacrifices, and inner purity", descriptionHindi: "यज्ञ अनुष्ठानों के मंत्र और कर्मकांड का दार्शनिक आधार" },
    { id: "chapter_3", number: 3, nameEnglish: "Samaveda (सामवेद)", nameHindi: "सामवेद संहिता", descriptionEnglish: "The melodic chanting of spiritual hymns and music roots", descriptionHindi: "संगीत और स्वरों का पावन वेद, उपासना के मधुर गान" },
    { id: "chapter_4", number: 4, nameEnglish: "Atharvaveda (अथर्ववेद)", nameHindi: "अथर्ववेद संहिता", descriptionEnglish: "Daily life practices, sciences, health, and astronomy", descriptionHindi: "आयुर्वेद, औषधि विज्ञान, समाज कल्याण और दैनिक जीवन के सूत्र" }
  ],

  upanishads: [
    { id: "chapter_1", number: 1, nameEnglish: "Isha, Kena & Katha Upanishad", nameHindi: "ईश, केन और कठ उपनिषद", descriptionEnglish: "Om, the nature of self, and Nachiketa's dialogue with Death", descriptionHindi: "आत्मा का रहस्य, यमराज-नचिकेता संवाद" },
    { id: "chapter_2", number: 2, nameEnglish: "Prashna, Mundaka & Mandukya", nameHindi: "प्रश्न, मुण्डक और माण्डूक्य उपनिषद", descriptionEnglish: "Prana, the origins of creation, and 4 states of consciousness", descriptionHindi: "सत्यमेव जयते का मूल स्रोत और जाग्रत-स्वप्न-सुषुप्ति-तुरीय अवस्था" },
    { id: "chapter_3", number: 3, nameEnglish: "Taittiriya & Chandogya Upanishad", nameHindi: "तैत्तिरीय और छान्दोग्य उपनिषद", descriptionEnglish: "Food is God, ultimate oneness, and Tat Tvam Asi", descriptionHindi: "पंचकोश सिद्धांत और तत्वमसि (तुम ही ब्रह्म हो) उपदेश" },
    { id: "chapter_4", number: 4, nameEnglish: "Brihadaranyaka Upanishad", nameHindi: "बृहदारण्यक उपनिषद", descriptionEnglish: "Asato Ma Sadgamaya, Yajnavalkya and Maitreyi dialogue", descriptionHindi: "असतो मा सद्गमय का दिव्य स्रोत और याज्ञवल्क्य दर्शन" }
  ],

  saints: [
    { id: "chapter_1", number: 1, nameEnglish: "Ancient Gurus & Acharyas", nameHindi: "प्राचीन ऋषि और शंकराचार्य", descriptionEnglish: "Adi Shankara, Ramanuja, and Madhvacharya", descriptionHindi: "अद्वैत वेदांत के प्रणेता आदि शंकराचार्य और भक्ति दार्शनिक" },
    { id: "chapter_2", number: 2, nameEnglish: "Bhakti Movement Saints", nameHindi: "भक्ति काल के परम संत", descriptionEnglish: "Kabir, Tulsidas, Surdas, Meerabai, and Chaitanya Mahaprabhu", descriptionHindi: "संत कबीर, तुलसीदास, मीराबाई और महाप्रभु चैतन्य की दिव्य भक्ति" },
    { id: "chapter_3", number: 3, nameEnglish: "Modern Spiritual Masters", nameHindi: "आधुनिक युग के युगपुरुष", descriptionEnglish: "Ramakrishna Paramahamsa, Swami Vivekananda, Paramahansa Yogananda", descriptionHindi: "श्री रामकृष्ण परमहंस, स्वामी विवेकानंद और योग विज्ञान" }
  ],

  temples: [
    { id: "chapter_1", number: 1, nameEnglish: "Char Dham & Jyotirlingas", nameHindi: "चार धाम और ज्योतिर्लिंग", descriptionEnglish: "Kedarnath, Badrinath, Somnath, and sacred geography", descriptionHindi: "द्वादश ज्योतिर्लिंगों का इतिहास और चार पवित्र धाम" },
    { id: "chapter_2", number: 2, nameEnglish: "Architectural Marvels of the South", nameHindi: "दक्षिण भारत के भव्य देवालय", descriptionEnglish: "Meenakshi, Brihadeeswarar, and Hampi temples", descriptionHindi: "द्रविड़ शैली का अद्भुत स्थापत्य और मीनाक्षी मंदिर रहस्य" },
    { id: "chapter_3", number: 3, nameEnglish: "Historic Rebirth: Ayodhya & Kashi", nameHindi: "सांस्कृतिक पुनर्जागरण: अयोध्या और काशी", descriptionEnglish: "Ram Mandir, Vishwanath Corridor, and sacred centers", descriptionHindi: "श्री राम जन्मभूमि अयोध्या और काशी विश्वनाथ का दिव्य इतिहास" }
  ],

  indian_culture: [
    { id: "chapter_1", number: 1, nameEnglish: "Foundations of Sanatan Dharma", nameHindi: "सनातन संस्कृति के मूल स्तंभ", descriptionEnglish: "Four Purusharthas, Ashrama system, and Vedic lifestyle", descriptionHindi: "धर्म, अर्थ, काम, मोक्ष और ब्रह्मचर्य-गृहस्थ-वानप्रस्थ-संन्यास" },
    { id: "chapter_2", number: 2, nameEnglish: "Vedic Science & Cosmology", nameHindi: "वैदिक विज्ञान और खगोल", descriptionEnglish: "Concept of time (Yugas), Ayurveda, and math roots", descriptionHindi: "चार युगों का काल चक्र, आयुर्वेद चिकित्सा और वैदिक गणित" }
  ],

  festivals: [
    { id: "chapter_1", number: 1, nameEnglish: "Major Seasonal Celebrations", nameHindi: "प्रमुख ऋतु उत्सव", descriptionEnglish: "Diwali, Holi, Makar Sankranti, and scientific alignment", descriptionHindi: "दीपावली, होली, मकर संक्रांति का खगोलीय और आध्यात्मिक महत्व" },
    { id: "chapter_2", number: 2, nameEnglish: "Sacred Vrats & Nights", nameHindi: "पवित्र व्रत एवं महारात्रि", descriptionEnglish: "Mahashivratri, Navratri, Janmashtami, and spiritual fasting", descriptionHindi: "महाशिवरात्रि, शारदीय नवरात्रि व्रत और उपवास साधना" }
  ],

  yoga: [
    { id: "chapter_1", number: 1, nameEnglish: "Patanjali's Ashtanga Yoga Path", nameHindi: "पतंजलि अष्टांग योग", descriptionEnglish: "Yama, Niyama, Asana, Pranayama, Pratyahara, Dharana, Dhyana, Samadhi", descriptionHindi: "योग सूत्र के आठ अंग - यम, नियम, आसन से समाधि तक" },
    { id: "chapter_2", number: 2, nameEnglish: "Four Streams of Yoga", nameHindi: "योग की चार मुख्य धाराएँ", descriptionEnglish: "Karma, Bhakti, Jnana, and Raja Yoga", descriptionHindi: "निष्काम कर्म, अनन्य भक्ति, विवेक ज्ञान और राजयोग साधना" }
  ],

  meditation: [
    { id: "chapter_1", number: 1, nameEnglish: "Vedic & Buddhist Techniques", nameHindi: "वैदिक एवं ध्यान पद्धतियाँ", descriptionEnglish: "Mantra chanting, Vipassana, and breath awareness", descriptionHindi: "ओमकार जप, सोऽहम् साधना और साक्षी भाव" },
    { id: "chapter_2", number: 2, nameEnglish: "Kundalini & Chakra Activation", nameHindi: "कुंडलिनी और चक्र ध्यान", descriptionEnglish: "The seven spiritual energy centers and vital force flow", descriptionHindi: "मूलाधार से सहस्रार तक सात ऊर्जा चक्रों का वैज्ञानिक रहस्य" }
  ],

  sanskrit: [
    { id: "chapter_1", number: 1, nameEnglish: "The Language of Gods (Devbhasha)", nameHindi: "देवभाषा संस्कृत का परिचय", descriptionEnglish: "Alphabets, Maheshwara Sutras, and phonetic structure", descriptionHindi: "वर्णमाला, माहेश्वर सूत्र और संस्कृत व्याकरण की वैज्ञानिकता" },
    { id: "chapter_2", number: 2, nameEnglish: "Sacred Chants & Grammar", nameHindi: "प्रमुख श्लोक एवं सुभाषित", descriptionEnglish: "Understanding sandhi, declensions, and famous shlokas", descriptionHindi: "शांति पाठ, मंगलाचरण मंत्रों का सस्वर शुद्ध उच्चारण" }
  ],

  general_spiritual_knowledge: [
    { id: "chapter_1", number: 1, nameEnglish: "Core Beliefs & Karma Theory", nameHindi: "कर्म सिद्धांत और पुनर्जन्म", descriptionEnglish: "Sanchita, Prarabdha, and Kriyamana Karma", descriptionHindi: "संचित, प्रारब्ध और क्रियमाण कर्मों का दिव्य विधान" },
    { id: "chapter_2", number: 2, nameEnglish: "Divine Symbols & Practices", nameHindi: "दिव्य प्रतीक और दैनिक उपासना", descriptionEnglish: "Significance of Om, Swastika, Temple bells, and Aarti", descriptionHindi: "ॐ, स्वस्तिक, तिलक, आरती और दीप दर्शन का वैज्ञानिक आधार" }
  ]
};
