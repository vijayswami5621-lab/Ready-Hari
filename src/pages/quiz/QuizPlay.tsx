import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, getDoc, collection, query, where, getDocs, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as fallbacks from '../../utils/offlineFallbackData';
import { Quiz, Question, QuizProgress, QuizHistory, LeaderboardEntry } from './types';
import { SUBJECT_CHAPTERS } from './chaptersConfig';
import { 
  ArrowLeft, Clock, Award, ChevronRight, ChevronLeft, Bookmark, 
  Volume2, HelpCircle, AlertCircle, Sparkles, AlertTriangle, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHaptics } from '../../hooks/useHaptics';
import { useGoBack } from '../../hooks/useGoBack';

const getClientFallbackQuestions = (subjectId: string, chapterId: string, language: string): any[] => {
  const isEnglish = language.toLowerCase() === 'english';
  
  const mahabharataTemplates = [
    {
      textHindi: "महाभारत के रचयिता कौन हैं?",
      textEnglish: "Who is the composer of Mahabharata?",
      optionsHindi: ["महर्षि वेदव्यास", "महर्षि वाल्मीकि", "संत तुलसीदास", "कालीदास"],
      optionsEnglish: ["Sage Vedavyasa", "Sage Valmiki", "Saint Tulsidas", "Kalidasa"],
      correctHindi: "महर्षि वेदव्यास",
      correctEnglish: "Sage Vedavyasa",
      explanationHindi: "महाभारत महाकाव्य की रचना महर्षि कृष्णद्वैपायन वेदव्यास जी ने की थी।",
      explanationEnglish: "The Mahabharata was composed by Sage Krishna Dwaipayana Vedavyasa.",
      ref: "Mahabharata"
    },
    {
      textHindi: "महाभारत में कुल कितने पर्व (अध्याय समूह) हैं?",
      textEnglish: "How many Parvas (books/chapters) are there in Mahabharata?",
      optionsHindi: ["18 पर्व", "12 पर्व", "10 पर्व", "24 पर्व"],
      optionsEnglish: ["18 Parvas", "12 Parvas", "10 Parvas", "24 Parvas"],
      correctHindi: "18 पर्व",
      correctEnglish: "18 Parvas",
      explanationHindi: "महाभारत में कुल 18 पर्व हैं, जैसे आदि पर्व, सभा पर्व, भीष्म पर्व आदि।",
      explanationEnglish: "The Mahabharata is divided into 18 Parvas (books), including Adi Parva, Sabha Parva, Bhishma Parva, etc.",
      ref: "Mahabharata"
    },
    {
      textHindi: "भीष्म पितामह का वास्तविक/मूल नाम क्या था?",
      textEnglish: "What was the original birth name of Bhishma Pitamah?",
      optionsHindi: ["देवव्रत", "कर्ण", "शान्तनु", "चित्रांगद"],
      optionsEnglish: ["Devavrata", "Karna", "Shantanu", "Chitrangada"],
      correctHindi: "देवव्रत",
      correctEnglish: "Devavrata",
      explanationHindi: "भीष्म पितामह राजा शान्तनु और देवी गंगा के पुत्र थे, जिसका मूल नाम देवव्रत था।",
      explanationEnglish: "Bhishma's original name was Devavrata, the son of King Shantanu and Goddess Ganga.",
      ref: "Mahabharata"
    },
    {
      textHindi: "युधिष्ठिर, भीम और अर्जुन की माता का क्या नाम था?",
      textEnglish: "What was the name of the mother of Yudhishthira, Bhima, and Arjuna?",
      optionsHindi: ["कुंती", "माद्री", "गांधारी", "सत्यवती"],
      optionsEnglish: ["Kunti", "Madri", "Gandhari", "Satyavati"],
      correctHindi: "कुंती",
      correctEnglish: "Kunti",
      explanationHindi: "महाराज पाण्डु की ज्येष्ठ पत्नी कुंती ने धर्मराज, पवन देव और इंद्र के अंश से युधिष्ठिर, भीम और अर्जुन को जन्म दिया था।",
      explanationEnglish: "Kunti was the senior queen of King Pandu who gave birth to Yudhishthira, Bhima, and Arjuna.",
      ref: "Mahabharata"
    },
    {
      textHindi: "महाभारत युद्ध में चक्रव्यूह भेदने के दौरान किस वीर योद्धा ने वीरगति प्राप्त की थी?",
      textEnglish: "Which brave warrior achieved martyrdom while breaking the Chakravyuha in the Mahabharata war?",
      optionsHindi: ["अभिमन्यु", "घटोत्कच", "लक्ष्मण कुमार", "द्रुपद"],
      optionsEnglish: ["Abhimanyu", "Ghatotkacha", "Lakshmana Kumara", "Drupada"],
      correctHindi: "अभिमन्यु",
      correctEnglish: "Abhimanyu",
      explanationHindi: "अर्जुन के पुत्र वीर अभिमन्यु ने कुरुक्षेत्र युद्ध के 13वें दिन द्रोणाचार्य द्वारा रचित चक्रव्यूह में प्रवेश कर शौर्यपूर्वक लड़ते हुए वीरगति प्राप्त की थी।",
      explanationEnglish: "Abhimanyu, the son of Arjuna, heroically entered and fought in the Chakravyuha on the 13th day of the war.",
      ref: "Mahabharata"
    }
  ];

  const shivPuranTemplates = [
    {
      textHindi: "शिव पुराण के अनुसार भगवान शिव का मुख्य वाहन कौन है?",
      textEnglish: "According to Shiva Purana, who is the primary vehicle (vahana) of Lord Shiva?",
      optionsHindi: ["नंदी (बैल)", "गरुड़ (चील)", "सिंह (शेर)", "मयूर (मोर)"],
      optionsEnglish: ["Nandi (Bull)", "Garuda (Eagle)", "Lion", "Peacock"],
      correctHindi: "नंदी (बैल)",
      correctEnglish: "Nandi (Bull)",
      explanationHindi: "भगवान शिव के वाहन नंदी (बैल) हैं, जो धर्म, बल और निष्ठा के प्रतीक हैं।",
      explanationEnglish: "Nandi, the sacred bull, is Lord Shiva's mount, representing righteousness and devotion.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "भारत वर्ष में कुल कितने प्रमुख ज्योतिर्लिंग स्थापित हैं?",
      textEnglish: "How many major Jyotirlingas are established across India?",
      optionsHindi: ["12", "10", "108", "7"],
      optionsEnglish: ["12", "10", "108", "7"],
      correctHindi: "12",
      correctEnglish: "12",
      explanationHindi: "भारत में कुल 12 स्वयंभू ज्योतिर्लिंग हैं, जिनमें सोमनाथ, केदारनाथ, काशी विश्वनाथ और महाकालेश्वर शामिल हैं।",
      explanationEnglish: "There are 12 self-manifested Jyotirlingas in India, such as Somnath, Kedarnath, and Kashi Vishwanath.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "माता पार्वती किस महान पर्वतराज की पुत्री थीं?",
      textEnglish: "Goddess Parvati was the daughter of which great mountain king?",
      optionsHindi: ["हिमालय (हिमवान)", "विंध्याचल", "सुमेरु", "कैलाश"],
      optionsEnglish: ["Himavan (Himalaya)", "Vindhyachal", "Sumeru", "Kailash"],
      correctHindi: "हिमालय (हिमवान)",
      correctEnglish: "Himavan (Himalaya)",
      explanationHindi: "माता पार्वती पर्वतराज हिमवान (हिमालय) और रानी मैना की पुत्री थीं, इसलिए उन्हें शैलपुत्री और हेमवती भी कहा जाता है।",
      explanationEnglish: "Goddess Parvati was the daughter of the mountain king Himavan and Queen Maina.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "भगवान शिव और माता पार्वती के ज्येष्ठ पुत्र का क्या नाम है जिन्होंने तारकासुर का वध किया था?",
      textEnglish: "What is the name of Shiva and Parvati's elder son who slayed the demon Tarakasura?",
      optionsHindi: ["कार्तिकेय (स्कंद)", "गणेश", "अशोक सुंदरी", "जलंधर"],
      optionsEnglish: ["Kartikeya (Skanda)", "Ganesha", "Ashoka Sundari", "Jalandhara"],
      correctHindi: "कार्तिकेय (स्कंद)",
      correctEnglish: "Kartikeya (Skanda)",
      explanationHindi: "भगवान शिव और पार्वती के बड़े पुत्र कार्तिकेय (स्कंद) हैं, जिन्होंने देवताओं के सेनापति बनकर तारकासुर का अंत किया था।",
      explanationEnglish: "Kartikeya (also known as Skanda or Murugan) is the elder son of Shiva who defeated Tarakasura.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "शिवरात्रि का पावन व्रत किस हिंदू महीने के कृष्ण पक्ष की चतुर्दशी को मनाया जाता है?",
      textEnglish: "The auspicious fast of Maha Shivratri is celebrated on the Chaturdashi of Krishna Paksha in which Hindu month?",
      optionsHindi: ["फाल्गुन", "कार्तिक", "सावन", "आश्विन"],
      optionsEnglish: ["Phalguna", "Kartika", "Shravana", "Ashvina"],
      correctHindi: "फाल्गुन",
      correctEnglish: "Phalguna",
      explanationHindi: "फाल्गुन मास के कृष्ण पक्ष की चतुर्दशी तिथि को शिव और पार्वती के पावन विवाह के उपलक्ष्य में महाशिवरात्रि मनाई जाती है।",
      explanationEnglish: "Maha Shivratri is celebrated in the month of Phalguna on Krishna Paksha Chaturdashi.",
      ref: "Shiva Purana"
    }
  ];

  const vishnuPuranTemplates = [
    {
      textHindi: "विष्णु पुराण के अनुसार भगवान विष्णु के प्रमुख कुल कितने मुख्य अवतार (दशावतार) माने गए हैं?",
      textEnglish: "According to Vishnu Purana, how many primary incarnations (Dashavatara) of Lord Vishnu are recognized?",
      optionsHindi: ["10", "12", "24", "4"],
      optionsEnglish: ["10", "12", "24", "4"],
      correctHindi: "10",
      correctEnglish: "10",
      explanationHindi: "भगवान विष्णु के 10 मुख्य अवतार (दशावतार) माने गए हैं, जिनमें मत्स्य, कूर्म, वराह से लेकर भावी कल्कि अवतार शामिल हैं।",
      explanationEnglish: "The ten primary incarnations of Lord Vishnu are known as the Dashavatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के परम भक्त बालक प्रह्लाद के पिता का क्या नाम था?",
      textEnglish: "What was the name of the father of the child devotee Prahlada?",
      optionsHindi: ["हिरण्यकशिपु", "हिरण्याक्ष", "रावण", "कंस"],
      optionsEnglish: ["Hiranyakashipu", "Hiranyaksha", "Ravana", "Kansa"],
      correctHindi: "हिरण्यकशिपु",
      correctEnglish: "Hiranyakashipu",
      explanationHindi: "बालक प्रह्लाद के पिता दैत्यराज हिरण्यकशिपु थे, जिनका वध करने के लिए भगवान विष्णु ने नृसिंह अवतार लिया था।",
      explanationEnglish: "Prahlada's father was the demon king Hiranyakashipu, who was slain by Vishnu in Narasimha avatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के उस पावन वाहन का नाम क्या है जो पक्षीराज कहलाते हैं?",
      textEnglish: "What is the name of Lord Vishnu's sacred mount who is known as the king of birds?",
      optionsHindi: ["गरुड़", "नंदी", "शेषनाग", "ऐरावत"],
      optionsEnglish: ["Garuda", "Nandi", "Sheshnag", "Airavata"],
      correctHindi: "गरुड़",
      correctEnglish: "Garuda",
      explanationHindi: "भगवान विष्णु का पावन वाहन गरुड़ देव हैं, जो पक्षियों के राजा और तीव्र गति के प्रतीक हैं।",
      explanationEnglish: "Garuda, the divine king of birds, serves as the vehicle of Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के हाथ में सुशोभित चक्र का क्या नाम है?",
      textEnglish: "What is the name of the divine discus (chakra) held by Lord Vishnu?",
      optionsHindi: ["सुदर्शन चक्र", "पिनाक", "कालचक्र", "वज्र"],
      optionsEnglish: ["Sudarshana Chakra", "Pinaka", "Kalachakra", "Vajra"],
      correctHindi: "सुदर्शन चक्र",
      correctEnglish: "Sudarshana Chakra",
      explanationHindi: "भगवान विष्णु के हाथ में सुशोभित चक्र सुदर्शन चक्र कहलाता है, जो ब्रह्मांड का अमोघ शस्त्र है।",
      explanationEnglish: "The Sudarshana Chakra is the spinning, disc-like weapon held by Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु की अर्धांगिनी और धन-ऐश्वर्य की अधिष्ठात्री देवी कौन हैं?",
      textEnglish: "Who is Lord Vishnu's consort and the goddess of wealth and prosperity?",
      optionsHindi: ["देवी लक्ष्मी", "देवी सरस्वती", "देवी पार्वती", "देवी गायत्री"],
      optionsEnglish: ["Goddess Lakshmi", "Goddess Saraswati", "Goddess Parvati", "Goddess Gayatri"],
      correctHindi: "देवी लक्ष्मी",
      correctEnglish: "Goddess Lakshmi",
      explanationHindi: "भगवान विष्णु की अर्धांगिनी जगन्माता महालक्ष्मी हैं, जो सृष्टि की पालन शक्ति और ऐश्वर्य की देवी हैं।",
      explanationEnglish: "Goddess Lakshmi is the divine consort of Vishnu, presiding over wealth and abundance.",
      ref: "Vishnu Purana"
    }
  ];

  const bhagavatamTemplates = [
    {
      textHindi: "श्रीमद्भागवत महापुराण में कुल कितने स्कंध (भाग) हैं?",
      textEnglish: "How many Cantos (Skandhas) are there in Srimad Bhagavatam?",
      optionsHindi: ["12 स्कंध", "18 स्कंध", "10 स्कंध", "7 स्कंध"],
      optionsEnglish: ["12 Cantos", "18 Cantos", "10 Cantos", "7 Cantos"],
      correctHindi: "12 स्कंध",
      correctEnglish: "12 Cantos",
      explanationHindi: "श्रीमद्भागवत में कुल 12 स्कंध और 18,000 श्लोक हैं, जो भक्ति रस से परिपूर्ण हैं।",
      explanationEnglish: "Srimad Bhagavatam consists of 12 Cantos (Skandhas) and contains approximately 18,000 verses.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "महाराज परीक्षित को सात दिनों में मुक्ति दिलाने के लिए श्रीमद्भागवत कथा का श्रवण किसने कराया था?",
      textEnglish: "Who narrated the Srimad Bhagavatam to King Parikshit to grant him liberation in seven days?",
      optionsHindi: ["शुकदेव जी", "सूत जी", "नारद मुनि", "व्यास देव"],
      optionsEnglish: ["Shukadeva Goswami", "Suta Goswami", "Narada Muni", "Vyasa Dev"],
      correctHindi: "शुकदेव जी",
      correctEnglish: "Shukadeva Goswami",
      explanationHindi: "व्यास पुत्र परम ज्ञानी श्री शुकदेव जी ने गंगा तट पर महाराज परीक्षित को भागवत कथा सुनाई थी।",
      explanationEnglish: "Sage Shukadeva, the son of Vyasa, narrated this supreme scripture to King Parikshit on the banks of Ganga.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "श्रीमद्भागवत के किस स्कंध में भगवान श्रीकृष्ण के बाल्यकाल और रासलीला का विस्तृत वर्णन है?",
      textEnglish: "Which Canto of Bhagavatam contains the detailed pastimes of Lord Krishna's childhood and Rasa Leela?",
      optionsHindi: ["दशम स्कंध (Canto 10)", "प्रथम स्कंध", "द्वादश स्कंध", "पंचम स्कंध"],
      optionsEnglish: ["Canto 10", "Canto 1", "Canto 12", "Canto 5"],
      correctHindi: "दशम स्कंध (Canto 10)",
      correctEnglish: "Canto 10",
      explanationHindi: "श्रीमद्भागवत का सख दशम स्कंध पूर्ण रूप से भगवान श्रीकृष्ण की बाल लीलाओं, माखनचोरी, और महारास पर आधारित है।",
      explanationEnglish: "The 10th Canto is the heart of Bhagavatam, dedicated entirely to the pastimes of Lord Krishna.",
      ref: "Srimad Bhagavatam Canto 10"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के उस परम मित्र का क्या नाम था जो अत्यंत निर्धन ब्राह्मण थे और संदीपनि आश्रम में सहपाठी थे?",
      textEnglish: "What was the name of Lord Krishna's poor Brahmin childhood friend and classmate at Sandipani Ashram?",
      optionsHindi: ["सुदामा", "उद्धव", "अक्रूर", "अर्जुन"],
      optionsEnglish: ["Sudama", "Uddhava", "Akrura", "Arjuna"],
      correctHindi: "सुदामा",
      correctEnglish: "Sudama",
      explanationHindi: "कृष्ण के परम सखा सुदामा थे, जिनकी दीनदशा देखकर द्वारकाधीश श्रीकृष्ण ने उनके आंसुओं से पैर धोए थे।",
      explanationEnglish: "Sudama was Lord Krishna's beloved classmate whose humble devotion moved Krishna to wash his feet with tears.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के परम ज्ञानी सखा और दूत का क्या नाम था जिन्हें कृष्ण ने गोपियों को सांत्वना देने हेतु वृंदावन भेजा था?",
      textEnglish: "What was the name of Lord Krishna's wise friend and messenger whom he sent to Vrindavan to console the Gopis?",
      optionsHindi: ["उद्धव", "सुदामा", "अक्रूर", "बलराम"],
      optionsEnglish: ["Uddhava", "Sudama", "Akrura", "Balarama"],
      correctHindi: "उद्धव",
      correctEnglish: "Uddhava",
      explanationHindi: "श्रीकृष्ण के ज्ञानी सखा उद्धव थे, जिन्हें ज्ञान का अभिमान दूर करने और प्रेम का पाठ सीखने हेतु कृष्ण ने ब्रज भेजा था।",
      explanationEnglish: "Uddhava, the wise disciple of Brihaspati and friend of Krishna, was sent to Vrindavan with a message for the Gopis.",
      ref: "Srimad Bhagavatam Canto 10"
    }
  ];

  const vedasTemplates = [
    {
      textHindi: "संसार के सबसे प्राचीनतम लिखित ग्रंथ का क्या नाम है?",
      textEnglish: "What is the name of the oldest written scripture in the world?",
      optionsHindi: ["ऋग्वेद", "सामवेद", "यजुर्वेद", "अथर्ववेद"],
      optionsEnglish: ["Rigveda", "Samaveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "ऋग्वेद",
      correctEnglish: "Rigveda",
      explanationHindi: "ऋग्वेद को मानव सभ्यता और सनातन धर्म का प्राचीनतम आदि ग्रंथ माना जाता है।",
      explanationEnglish: "The Rigveda is universally recognized as the oldest sacred text in human history.",
      ref: "Rigveda"
    },
    {
      textHindi: "सनातन धर्म के आधारभूत कुल कितने वेद हैं?",
      textEnglish: "How many Vedas are there in Sanatan Dharma?",
      optionsHindi: ["4 वेद", "3 वेद", "108 वेद", "18 वेद"],
      optionsEnglish: ["4 Vedas", "3 Vedas", "108 Vedas", "18 Vedas"],
      correctHindi: "4 वेद",
      correctEnglish: "4 Vedas",
      explanationHindi: "वेद चार हैं: ऋग्वेद, यजुर्वेद, सामवेद और अथर्ववेद। इन्हें 'संहिता' भी कहा जाता है।",
      explanationEnglish: "The four Vedas are Rigveda, Yajurveda, Samaveda, and Atharvaveda.",
      ref: "Vedas"
    },
    {
      textHindi: "भारतीय शास्त्रीय संगीत और स्वरों का मूल किस वेद को माना जाता है?",
      textEnglish: "Which Veda is considered the foundational source of Indian classical music and melodies?",
      optionsHindi: ["सामवेद", "ऋग्वेद", "यजुर्वेद", "अथर्ववेद"],
      optionsEnglish: ["Samaveda", "Rigveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "सामवेद",
      correctEnglish: "Samaveda",
      explanationHindi: "सामवेद में यज्ञों के समय गाए जाने वाले मंत्रों का संकलन है, जो भारतीय संगीत का जनक है।",
      explanationEnglish: "The Samaveda consists of melodies and chants, serving as the root of Indian music science.",
      ref: "Samaveda"
    },
    {
      textHindi: "प्रसिद्ध गायत्री मंत्र 'ॐ भूर्भुवः स्वः' ऋग्वेद के किस मंडल से लिया गया है?",
      textEnglish: "The famous Gayatri Mantra is found in which Mandala of the Rigveda?",
      optionsHindi: ["तृतीय मंडल (3rd Mandala)", "प्रथम मंडल", "दसवां मंडल", "नौवां मंडल"],
      optionsEnglish: ["3rd Mandala", "1st Mandala", "10th Mandala", "9th Mandala"],
      correctHindi: "तृतीय मंडल (3rd Mandala)",
      correctEnglish: "3rd Mandala",
      explanationHindi: "गायत्री मंत्र ऋग्वेद के तृतीय मंडल के ६२वें सूक्त का १०वां मंत्र है, जिसके रचयिता महर्षि विश्वामित्र हैं।",
      explanationEnglish: "The Gayatri Mantra was revealed by Sage Vishwamitra and is situated in the 3rd Mandala of Rigveda.",
      ref: "Rigveda 3.62.10"
    },
    {
      textHindi: "आयुर्वेद, जड़ी-बूटियों, दैनिक विज्ञान और गृह-वास्तु का वर्णन विशेष रूप से किस वेद में मिलता है?",
      textEnglish: "The description of Ayurveda, herbal medicines, house construction, and daily sciences is primarily found in which Veda?",
      optionsHindi: ["अथर्ववेद", "ऋग्वेद", "यजुर्वेद", "सामवेद"],
      optionsEnglish: ["Atharvaveda", "Rigveda", "Yajurveda", "Samaveda"],
      correctHindi: "अथर्ववेद",
      correctEnglish: "Atharvaveda",
      explanationHindi: "अथर्ववेद में जड़ी-बूटियों, आयुर्वेद, शांति कर्म और लोक कल्याणकारी लौकिक विषयों का वर्णन है।",
      explanationEnglish: "The Atharvaveda contains details on daily life, sciences, medicine (Ayurveda), and societal ethics.",
      ref: "Atharvaveda"
    }
  ];

  const upanishadsTemplates = [
    {
      textHindi: "उपनिषद का शाब्दिक अर्थ क्या होता है?",
      textEnglish: "What is the literal meaning of the word 'Upanishad'?",
      optionsHindi: ["गुरु के समीप श्रद्धापूर्वक बैठना", "ईश्वर की स्तुति करना", "जंगल में जाकर तपस्या करना", "ग्रंथों का पाठ करना"],
      optionsEnglish: ["To sit down devotedly near the teacher", "To praise the Lord", "To meditate in forests", "To recite holy books"],
      correctHindi: "गुरु के समीप श्रद्धापूर्वक बैठना",
      correctEnglish: "To sit down devotedly near the teacher",
      explanationHindi: "उपनिषद का अर्थ है 'उप' (समीप) 'नि' (श्रद्धापूर्वक) 'षद' (बैठना) - अर्थात् आत्मज्ञान के लिए गुरु के चरणों में बैठना।",
      explanationEnglish: "Upanishad literally means sitting down devotedly near a spiritual preceptor to receive sacred wisdom.",
      ref: "Upanishads"
    },
    {
      textHindi: "भारत के राजकीय प्रतीक पर अंकित सूत्र 'सत्यमेव जयते' किस उपनिषद से लिया गया है?",
      textEnglish: "The national motto of India 'Satyameva Jayate' (Truth alone triumphs) is taken from which Upanishad?",
      optionsHindi: ["मुण्डक उपनिषद (Mundaka Upanishad)", "कठ उपनिषद", "माण्डूक्य उपनिषद", "ईशावास्य उपनिषद"],
      optionsEnglish: ["Mundaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Ishavasya Upanishad"],
      correctHindi: "मुण्डक उपनिषद (Mundaka Upanishad)",
      correctEnglish: "Mundaka Upanishad",
      explanationHindi: "सत्यमेव जयते मुण्डक उपनिषद के तीसरे मुण्डक के प्रथम खंड का छठा मंत्र है।",
      explanationEnglish: "'Satyameva Jayate' is a sacred mantra from Mundaka Upanishad, signifying the ultimate victory of truth.",
      ref: "Mundaka Upanishad"
    },
    {
      textHindi: "यमराज और बालक नचिकेता के बीच हुआ अमर आत्मा का संवाद किस उपनिषद में वर्णित है?",
      textEnglish: "The dialogue between Lord Yama (Death) and the child Nachiketa regarding the secret of the soul is in which Upanishad?",
      optionsHindi: ["कठ उपनिषद (Katha Upanishad)", "केन उपनिषद", "तैत्तिरीय उपनिषद", "छान्दोग्य उपनिषद"],
      optionsEnglish: ["Katha Upanishad", "Kena Upanishad", "Taittiriya Upanishad", "Chandogya Upanishad"],
      correctHindi: "कठ उपनिषद (Katha Upanishad)",
      correctEnglish: "Katha Upanishad",
      explanationHindi: "कठ उपनिषद में नचिकेता के तीन वरदानों और यमराज द्वारा दिए गए आत्मा के अमरत्व के ज्ञान का अनुपम प्रसंग है।",
      explanationEnglish: "The Katha Upanishad contains the legendary conversation where Yama explains the nature of the Self to Nachiketa.",
      ref: "Katha Upanishad"
    },
    {
      textHindi: "उपनिषदों का मुख्य विषय क्या है जिसके कारण इन्हें 'वेदांत' भी कहा जाता है?",
      textEnglish: "What is the primary subject matter of Upanishads, due to which they are also called 'Vedanta'?",
      optionsHindi: ["ब्रह्मविद्या एवं आत्मज्ञान", "यज्ञ अनुष्ठान और कर्मकांड", "देवी-देवताओं की पूजा", "इतिहास और वंशावली"],
      optionsEnglish: ["Brahmavidya and Self-Knowledge", "Rituals and Sacrifices", "Deity worship", "History and genealogy"],
      correctHindi: "ब्रह्मविद्या एवं आत्मज्ञान",
      correctEnglish: "Brahmavidya and Self-Knowledge",
      explanationHindi: "उपनिषद वेदों के अंतिम भाग हैं (वेदांत) जिनका परम लक्ष्य आत्मा और परमात्मा के एकत्व (ब्रह्मज्ञान) का प्रतिपादन करना है।",
      explanationEnglish: "Upanishads mark the culmination of Vedic wisdom, focusing purely on metaphysical reality and Self-realization.",
      ref: "Upanishads"
    },
    {
      textHindi: "प्रसिद्ध शांति पाठ 'असतो मा सद्गमय, तमसो मा ज्योतिर्गमय' किस उपनिषद से लिया गया है?",
      textEnglish: "The famous peace prayer 'Asato Ma Sadgamaya...' is extracted from which Upanishad?",
      optionsHindi: ["बृहदारण्यक उपनिषद", "छान्दोग्य उपनिषद", "श्वेताश्वतर उपनिषद", "तैत्तिरीय उपनिषद"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Chandogya Upanishad", "Shvetashvatara Upanishad", "Taittiriya Upanishad"],
      correctHindi: "बृहदारण्यक उपनिषद",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "यह मंत्र बृहदारण्यक उपनिषद (1.3.28) से लिया गया है, जिसका अर्थ है 'मुझे असत्य से सत्य की ओर, अंधकार से प्रकाश की ओर ले चलो।'",
      explanationEnglish: "This sacred chant is from the Brihadaranyaka Upanishad, praying for transition from untruth to truth, and darkness to light.",
      ref: "Brihadaranyaka Upanishad"
    }
  ];

  const saintsTemplates = [
    {
      textHindi: "अद्वैत वेदांत दर्शन के पुनरुद्धारक और चार दिशाओं में चार पीठों के संस्थापक कौन थे?",
      textEnglish: "Who was the rejuvenator of Advaita Vedanta and founder of the four sacred monasteries (Peethas)?",
      optionsHindi: ["आदि शंकराचार्य", "रामानुजाचार्य", "मध्वाचार्य", "संत कबीर"],
      optionsEnglish: ["Adi Shankaracharya", "Ramanujacharya", "Madhvacharya", "Saint Kabir"],
      correctHindi: "आदि शंकराचार्य",
      correctEnglish: "Adi Shankaracharya",
      explanationHindi: "आदिगुरु शंकराचार्य जी ने अद्वैत मत का प्रचार किया और भारत की चारों दिशाओं (बद्रीनाथ, द्वारका, पुरी, श्रृंगेरी) में चार पीठ स्थापित किए।",
      explanationEnglish: "Adi Shankaracharya established the four cardinal monastic centers to preserve Vedic culture.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "Swami Vivekananda के परम पूज्य आध्यात्मिक गुरु कौन थे जिनके नाम पर बेलूर मठ की स्थापना हुई?",
      textEnglish: "Who was the highly revered spiritual master of Swami Vivekananda, in whose name Belur Math was founded?",
      optionsHindi: ["श्री रामकृष्ण परमहंस", "स्वामी दयानंद सरस्वती", "परमहंस योगानंद", "तैलग स्वामी"],
      optionsEnglish: ["Sri Ramakrishna Paramahamsa", "Swami Dayananda Saraswati", "Paramahansa Yogananda", "Trailanga Swami"],
      correctHindi: "श्री रामकृष्ण परमहंस",
      correctEnglish: "Sri Ramakrishna Paramahamsa",
      explanationHindi: "विवेकानंद के गुरु दक्षिणेश्वर के संत श्री रामकृष्ण परमहंस जी थे, जिन्होंने भक्ति और समाधि का साक्षात् उदाहरण प्रस्तुत किया।",
      explanationEnglish: "Sri Ramakrishna Paramahamsa was the spiritual mentor of Swami Vivekananda who taught the synthesis of all faiths.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "मध्यकालीन संत मीराबाई किस आराध्य देव की अनन्य और भावपूर्ण साधिका थीं?",
      textEnglish: "The medieval saint Meerabai was an ecstatic devotee of which Lord?",
      optionsHindi: ["श्री कृष्ण", "श्री राम", "भगवान शिव", "हनुमान जी"],
      optionsEnglish: ["Lord Krishna", "Lord Rama", "Lord Shiva", "Hanuman Ji"],
      correctHindi: "श्री कृष्ण",
      correctEnglish: "Lord Krishna",
      explanationHindi: "मीराबाई श्री कृष्ण को ही अपना सब कुछ (गिरधर गोपाल) मानकर पद और भजनों के माध्यम से उनकी भक्ति में लीन रहती थीं।",
      explanationEnglish: "Meerabai was a Rajput princess who renounced royal life to sing ecstatic praises of Lord Krishna.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "छत्रपति शिवाजी महाराज के आध्यात्मिक मार्गदर्शक और 'दासबोध' के रचयिता कौन से महान समर्थ संत थे?",
      textEnglish: "Who was the spiritual guide of Chhatrapati Shivaji Maharaj and composer of the spiritual text 'Dasbodh'?",
      optionsHindi: ["समर्थ रामदास", "संत ज्ञानेश्वर", "संत तुकाराम", "संत एकनाथ"],
      optionsEnglish: ["Samarth Ramdas", "Saint Dnyaneshwar", "Saint Tukaram", "Saint Eknath"],
      correctHindi: "समर्थ रामदास",
      correctEnglish: "Samarth Ramdas",
      explanationHindi: "महाराष्ट्र के महान समर्थ गुरु रामदास जी शिवाजी महाराज के गुरु थे, जिन्होंने 'दासबोध' और 'मनाचे श्लोक' की रचना की।",
      explanationEnglish: "Samarth Ramdas was the highly revered Marathi saint who served as the preceptor of Shivaji Maharaj.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "महारानी अहिल्याबाई होल्कर के जीवन चरित्र और शिवभक्ति से जुड़े मुख्य प्रसंगों के अनुसार, उन्होंने किस पावन ज्योतिर्लिंग मंदिर का जीर्णोद्धार करवाया था?",
      textEnglish: "According to the life of Queen Ahilyabai Holkar and her devotion to Shiva, which sacred Jyotirlinga temple did she reconstruct?",
      optionsHindi: ["काशी विश्वनाथ (Kashi Vishwanath)", "सोमनाथ", "महाकालेश्वर", "केदारनाथ"],
      optionsEnglish: ["Kashi Vishwanath", "Somnath", "Mahakaleshwar", "Kedarnath"],
      correctHindi: "काशी विश्वनाथ (Kashi Vishwanath)",
      correctEnglish: "Kashi Vishwanath",
      explanationHindi: "इंदौर की महारानी देवी अहिल्याबाई होल्कर जी ने काशी विश्वनाथ मंदिर का भव्य पुनर्निर्माण करवाया था, जो मुगल आक्रांताओं द्वारा नष्ट किया गया था।",
      explanationEnglish: "Queen Ahilyabai Holkar of Indore reconstructed the Kashi Vishwanath temple in 1780.",
      ref: "Saints & Gurus"
    }
  ];

  const templesTemplates = [
    {
      textHindi: "उत्तराखंड के गढ़वाल हिमालय में स्थित केदारनाथ ज्योतिर्लिंग मंदिर किस नदी के निकट स्थापित है?",
      textEnglish: "The sacred Kedarnath Jyotirlinga temple in Uttarakhand is situated near which river?",
      optionsHindi: ["मंदाकिनी नदी", "अलकनंदा नदी", "भागीरथी नदी", "यमुना"],
      optionsEnglish: ["Mandakini River", "Alaknanda River", "Bhagirathi River", "Yamuna"],
      correctHindi: "मंदाकिनी नदी",
      correctEnglish: "Mandakini River",
      explanationHindi: "केदारनाथ मंदिर मंदाकिनी नदी के तट पर स्थित है, जो भगवान शिव का अत्यंत महिमामय धाम है।",
      explanationEnglish: "Kedarnath temple is located on the bank of the Mandakini river amidst the majestic Himalayas.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "भारत के दक्षिणतम छोर रामेश्वरम द्वीप पर स्थापित ज्योतिर्लिंग मंदिर का क्या नाम है जिसकी स्थापना स्वयं प्रभु श्री राम ने की थी?",
      textEnglish: "What is the name of the Jyotirlinga temple on Rameswaram island which was established by Lord Rama himself?",
      optionsHindi: ["रामनाथस्वामी मंदिर", "मल्लिकार्जुन", "सोमनाथ", "भीमाशंकर"],
      optionsEnglish: ["Ramanathaswamy Temple", "Mallikarjuna", "Somnath", "Bhimashankar"],
      correctHindi: "रामनाथस्वामी मंदिर",
      correctEnglish: "Ramanathaswamy Temple",
      explanationHindi: "रामेश्वरम में स्थापित रामनाथस्वामी मंदिर में स्थापित शिवलिंग की पूजा लंका विजय से पूर्व भगवान श्री राम ने बालू से बनाकर की थी।",
      explanationEnglish: "The Ramanathaswamy Temple houses one of the 12 Jyotirlingas, established by Lord Rama.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "ओडिशा के तटीय नगर पुरी में स्थापित जगन्नाथ मंदिर किस भगवान को पूर्णतः समर्पित है?",
      textEnglish: "The world-famous Jagannath Temple in Puri is dedicated to which form of the Supreme Lord?",
      optionsHindi: ["श्री कृष्ण, बलभद्र और सुभद्रा", "श्री राम और लक्ष्मण", "भगवान शिव", "विष्णु और लक्ष्मी"],
      optionsEnglish: ["Lord Krishna, Balabhadra, and Subhadra", "Lord Rama and Lakshmana", "Lord Shiva", "Vishnu and Lakshmi"],
      correctHindi: "श्री कृष्ण, बलभद्र और सुभद्रा",
      correctEnglish: "Lord Krishna, Balabhadra, and Subhadra",
      explanationHindi: "जगन्नाथ पुरी धाम में भगवान कृष्ण (जगन्नाथ), उनके बड़े भाई बलभद्र और बहन सुभद्रा की काष्ठ की मूर्तियाँ स्थापित हैं।",
      explanationEnglish: "Puri Jagannath temple worships Lord Krishna along with his siblings Balabhadra and Subhadra in wooden deities.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "ओडिशा के कोणार्क में स्थित सूर्य मंदिर की वास्तुकला किस विशिष्ट रूप में बनी हुई है?",
      textEnglish: "The Sun Temple in Konark, Odisha is uniquely built in the architectural shape of what?",
      optionsHindi: ["एक विशाल रथ (A massive chariot)", "एक कमल का फूल", "एक त्रिशूल", "एक नौका"],
      optionsEnglish: ["A massive chariot", "A lotus flower", "A trident", "A boat"],
      correctHindi: "एक विशाल रथ (A massive chariot)",
      correctEnglish: "A massive chariot",
      explanationHindi: "कोणार्क का सूर्य मंदिर सात घोड़ों और 24 पहियों वाले सूर्य देव के विशाल रथ के रूप में नक्काशीदार पत्थरों से बना है।",
      explanationEnglish: "The temple is conceptualized as a colossal chariot of the Sun God, decorated with stone wheels and horses.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "संसार की सबसे प्राचीन जीवित सांस्कृतिक नगरी वाराणसी में स्थापित प्रधान शिव मंदिर का क्या नाम है?",
      textEnglish: "What is the name of the primary Shiva temple in Varanasi, one of the oldest living cities in the world?",
      optionsHindi: ["काशी विश्वनाथ मंदिर", "मकालेश्वर", "त्रयम्बकेश्वर", "घृष्णेश्वर"],
      optionsEnglish: ["Kashi Vishwanath Temple", "Mahakaleshwar", "Trimbakeshwar", "Grishneshwar"],
      correctHindi: "काशी विश्वनाथ मंदिर",
      correctEnglish: "Kashi Vishwanath Temple",
      explanationHindi: "वाराणसी (काशी) में गंगा नदी के पश्चिमी तट पर स्थापित काशी विश्वनाथ ज्योतिर्लिंग शिव का परम पावन निवास माना जाता है।",
      explanationEnglish: "Kashi Vishwanath Temple is the spiritual crown of Varanasi, housing the sacred Jyotirlinga of Lord Shiva.",
      ref: "Sacred Temples"
    }
  ];

  const cultureTemplates = [
    {
      textHindi: "सनातन जीवन शैली के अनुसार मानव जीवन के चार पुरुषार्थ कौन से हैं?",
      textEnglish: "According to Sanatan lifestyle, what are the four goals/pursuits (Purusharthas) of human life?",
      optionsHindi: ["धर्म, अर्थ, काम, मोक्ष", "सत्य, अहिंसा, तप, दान", "ब्रह्मचर्य, गृहस्थ, वानप्रस्थ, संन्यास", "ऋग्वेद, यजुर्वेद, सामवेद, अथर्ववेद"],
      optionsEnglish: ["Dharma, Artha, Kama, Moksha", "Satya, Ahimsa, Tapa, Dana", "Brahmacharya, Grihastha, Vanaprastha, Sanyasa", "Rigveda, Yajurveda, Samaveda, Atharvaveda"],
      correctHindi: "धर्म, अर्थ, काम, मोक्ष",
      correctEnglish: "Dharma, Artha, Kama, Moksha",
      explanationHindi: "सनातन धर्म के अनुसार जीवन के चार मुख्य उद्देश्य हैं: धर्म (नैतिकता), अर्थ (संसाधन), काम (कामनाएं) और मोक्ष (मुक्ति)।",
      explanationEnglish: "The four Purusharthas define the comprehensive framework of a balanced, prosperous, and liberated life.",
      ref: "Indian Culture"
    },
    {
      textHindi: "हिंदू संस्कृति के अनुसार मनुष्य के जन्म से मृत्यु तक कुल कितने मुख्य संस्कार (संस्कार सिद्धांत) माने गए हैं?",
      textEnglish: "According to Hindu culture, how many primary life sacraments (Sanskaras) are performed from birth to death?",
      optionsHindi: ["16 (षोडश संस्कार)", "10", "12", "108"],
      optionsEnglish: ["16 (Shodasha Sanskaras)", "10", "12", "108"],
      correctHindi: "16 (षोडश संस्कार)",
      correctEnglish: "16 (Shodasha Sanskaras)",
      explanationHindi: "मानव जीवन को शुद्ध, सुसंस्कृत और उन्नत बनाने के लिए गर्भधान से अंत्येष्टि (मृत्यु) तक कुल 16 मुख्य संस्कार किए जाते हैं।",
      explanationEnglish: "The Shodasha Sanskaras are 16 fundamental stages and rituals that sanctify a human journey in Vedic tradition.",
      ref: "Indian Culture"
    },
    {
      textHindi: "वैदिक वर्णाश्रम व्यवस्था के अंतर्गत जीवन के प्रथम 25 वर्षों की अवधि किस आश्रम के अधीन मानी गई है?",
      textEnglish: "Under the Vedic Ashrama system, which stage of life is prescribed for the first 25 years of age?",
      optionsHindi: ["ब्रह्मचर्य आश्रम", "गृहस्थ आश्रम", "वानप्रस्थ आश्रम", "संन्यास आश्रम"],
      optionsEnglish: ["Brahmacharya Ashrama", "Grihastha Ashrama", "Vanaprastha Ashrama", "Sanyasa Ashrama"],
      correctHindi: "ब्रह्मचर्य आश्रम",
      correctEnglish: "Brahmacharya Ashrama",
      explanationHindi: "जीवन के प्रथम २५ वर्ष शिक्षा, संयम और चरित्र निर्माण हेतु ब्रह्मचर्य आश्रम के अंतर्गत गुरु के सान्निध्य में व्यतीत होते थे।",
      explanationEnglish: "Brahmacharya is the student stage of life, dedicated to learning, celibacy, and character development.",
      ref: "Indian Culture"
    },
    {
      textHindi: "महात्मा गांधी और ऋषियों द्वारा प्रतिपादित 'अहिंसा' का वास्तविक और दार्शनिक अर्थ क्या है?",
      textEnglish: "What is the true and philosophical meaning of 'Ahimsā' as propounded by sages?",
      optionsHindi: ["मन, वचन और कर्म से किसी को कष्ट न देना", "केवल शारीरिक चोट न पहुंचाना", "युद्ध से भाग जाना", "कमजोर बने रहना"],
      optionsEnglish: ["To not cause harm by thoughts, words, or actions", "Only avoiding physical injury", "Fleeing from battle", "Staying weak and passive"],
      correctHindi: "मन, वचन और कर्म से किसी को कष्ट न देना",
      correctEnglish: "To not cause harm by thoughts, words, or actions",
      explanationHindi: "वास्तविक अहिंसा मन, वाणी और शारीरिक स्तर पर किसी भी जीव को चोट न पहुंचाने का करुणामय सिद्धांत है।",
      explanationEnglish: "Ahimsā is a positive virtue of active harmlessness and universal compassion in thoughts, speech, and deeds.",
      ref: "Indian Culture"
    },
    {
      textHindi: "महोपनिषद का प्रसिद्ध वाक्य 'वसुधैव कुटुम्बकम्' संपूर्ण विश्व के बारे में क्या दृष्टिकोण रखता है?",
      textEnglish: "What perspective does the Upanishadic phrase 'Vasudhaiva Kutumbakam' hold towards the world?",
      optionsHindi: ["संपूर्ण विश्व ही हमारा परिवार है", "केवल अपना देश श्रेष्ठ है", "संसार दुखों का घर है", "भौतिक संपदा सब कुछ है"],
      optionsEnglish: ["The entire world is one single family", "Only one's nation is supreme", "The world is full of sorrow", "Material wealth is everything"],
      correctHindi: "संपूर्ण विश्व ही हमारा परिवार है",
      correctEnglish: "The entire world is one single family",
      explanationHindi: "'वसुधा एव कुटुम्बकम्' का अर्थ है पृथ्वी के समस्त प्राणी हमारे परिवार के सदस्य हैं, जो सनातन संस्कृति की उदारता दर्शाता है।",
      explanationEnglish: "This golden maxim declares that the whole cosmos is interconnected as one unified, harmonious family.",
      ref: "Indian Culture"
    }
  ];

  const festivalsTemplates = [
    {
      textHindi: "दीपों का पावन उत्सव दीपावली किस हिंदू तिथि को हर्षोल्लास के साथ मनाया जाता है?",
      textEnglish: "Diwali, the festival of lights, is celebrated on which Hindu lunar calendar day?",
      optionsHindi: ["कार्तिक अमावस्या (Kartika Amavasya)", "कार्तिक पूर्णिमा", "आश्विन पूर्णिमा", "फाल्गुन अमावस्या"],
      optionsEnglish: ["Kartika Amavasya", "Kartika Purnima", "Ashvina Purnima", "Phalguna Amavasya"],
      correctHindi: "कार्तिक अमावस्या (Kartika Amavasya)",
      correctEnglish: "Kartika Amavasya",
      explanationHindi: "कार्तिक मास की अमावस्या के गहन अंधकार को मिटाने के लिए प्रभु श्री राम के अयोध्या आगमन की स्मृति में दीप जलाए जाते हैं।",
      explanationEnglish: "Diwali falls on the darkest night (Amavasya) of Kartika month to welcome Lord Rama back to Ayodhya.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "मकर संक्रांति का पावन पर्व खगोलीय रूप से सूर्य के किस राशि में प्रवेश करने पर मनाया जाता है?",
      textEnglish: "Astronomically, the festival of Makara Sankranti marks the entry of the Sun into which zodiac sign?",
      optionsHindi: ["मकर राशि (Capricorn)", "मेष राशि", "धनु राशि", "कर्क राशि"],
      optionsEnglish: ["Capricorn (Makara)", "Aries (Mesha)", "Sagittarius (Dhanu)", "Cancer (Karka)"],
      correctHindi: "मकर राशि (Capricorn)",
      correctEnglish: "Capricorn (Makara)",
      explanationHindi: "सूर्य के धनु राशि से मकर राशि में प्रवेश करने की तिथि को मकर संक्रांति कहते हैं, जिससे सूर्य उत्तरायण होते हैं।",
      explanationEnglish: "Makara Sankranti marks the winter solstice when the sun begins its northward movement (Uttarayana) entering Capricorn.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "शारदीय और चैत्र नवरात्रि में नौ दिनों तक माँ दुर्गा के कितने पावन रूपों की आराधना की जाती है?",
      textEnglish: "How many sacred forms of Goddess Durga are worshipped during the nine nights of Navratri?",
      optionsHindi: ["9 रूप (नवदुर्गा)", "10 रूप", "7 रूप", "3 रूप"],
      optionsEnglish: ["9 Forms (Navadurga)", "10 Forms", "7 Forms", "3 Forms"],
      correctHindi: "9 रूप (नवदुर्गा)",
      correctEnglish: "9 Forms (Navadurga)",
      explanationHindi: "नवरात्रि में माँ शैलपुत्री, ब्रह्मचारिणी, चंद्रघंटा से लेकर सिद्धिदात्री तक नौ दिव्य रूपों (नवदुर्गा) की पूजा होती है।",
      explanationEnglish: "The festival of Navratri celebrates the nine distinct, powerful aspects of the Divine Mother Durga.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के पावन प्राकट्य उत्सव को किस नाम से पूरे देश में मनाया जाता है?",
      textEnglish: "By what name is the divine birth festival of Lord Krishna celebrated across India?",
      optionsHindi: ["कृष्ण जन्माष्टमी (Janmashtami)", "रामनवमी", "हनुमान जयंती", "गुरु पूर्णिमा"],
      optionsEnglish: ["Krishna Janmashtami", "Rama Navami", "Hanuman Jayanti", "Guru Purnima"],
      correctHindi: "कृष्ण जन्माष्टमी (Janmashtami)",
      correctEnglish: "Krishna Janmashtami",
      explanationHindi: "भाद्रपद मास के कृष्ण पक्ष की अष्टमी तिथि को रोहिणी नक्षत्र में मध्यरात्रि भगवान श्री कृष्ण का जन्म कंस के कारागार में हुआ था।",
      explanationEnglish: "Krishna Janmashtami marks the birth of Lord Krishna in Mathura on the eighth day of Bhadrapada dark fortnight.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "गंगा दशहरा का पावन त्योहार किस देवी के स्वर्ग से पृथ्वी पर अवतरण के उपलक्ष्य में मनाया जाता है?",
      textEnglish: "The auspicious festival of Ganga Dussehra is celebrated to mark the descent of which river Goddess to Earth?",
      optionsHindi: ["माँ गंगा", "माँ यमुना", "माँ सरस्वती", "माँ नर्मदा"],
      optionsEnglish: ["Goddess Ganga", "Goddess Yamuna", "Goddess Saraswati", "Goddess Narmada"],
      correctHindi: "माँ गंगा",
      correctEnglish: "Goddess Ganga",
      explanationHindi: "ज्येष्ठ शुक्ल दशमी को राजा भगीरथ की घोर तपस्या के फलस्वरूप माँ गंगा का स्वर्ग लोक से पृथ्वी पर पावन अवतरण हुआ था।",
      explanationEnglish: "Gengadevi descended from heaven to earth on this day to purify and liberate the ancestors of King Bhagiratha.",
      ref: "Festivals & Vrats"
    }
  ];

  const yogaTemplates = [
    {
      textHindi: "योग शास्त्र के सर्वोत्कृष्ट ग्रंथ 'योगसूत्र' के रचयिता कौन से महान महर्षि हैं?",
      textEnglish: "Who is the great sage behind the foundational scripture 'Yoga Sutras'?",
      optionsHindi: ["महर्षि पतंजलि", "महर्षि कपिल", "महर्षि कणाद", "महर्षि व्यास"],
      optionsEnglish: ["Maharishi Patanjali", "Maharishi Kapila", "Maharishi Kanada", "Maharishi Vyasa"],
      correctHindi: "महर्षि पतंजलि",
      correctEnglish: "Maharishi Patanjali",
      explanationHindi: "महर्षि पतंजलि ने मन के निग्रह और ध्यान साधना के लिए 196 योगसूत्रों की रचना की थी।",
      explanationEnglish: "Sage Patanjali systemized the science of Yoga into 196 aphorisms known as Patanjali Yoga Sutras.",
      ref: "Yoga Science"
    },
    {
      textHindi: "महर्षि पतंजलि द्वारा प्रतिपादित अष्टांग योग के कुल कितने अंग (सोपान) हैं?",
      textEnglish: "How many limbs make up the system of Ashtanga Yoga as defined by Patanjali?",
      optionsHindi: ["8 अंग", "5 अंग", "10 अंग", "12 अंग"],
      optionsEnglish: ["8 Limbs", "5 Limbs", "10 Limbs", "12 Limbs"],
      correctHindi: "8 अंग",
      correctEnglish: "8 Limbs",
      explanationHindi: "अष्टांग योग के आठ अंग हैं: यम, नियम, आसन, प्राणायाम, प्रत्याहार, धारणा, ध्यान और समाधि।",
      explanationEnglish: "Ashtanga Yoga literally means the eight-limbed path to self-control and spiritual liberation.",
      ref: "Yoga Science"
    },
    {
      textHindi: "अष्टांग योग का सर्वप्रथमतम अंग कौन सा है जो सामाजिक नैतिकता और आचरण से संबंधित है?",
      textEnglish: "What is the very first limb of Ashtanga Yoga which deals with ethical guidelines?",
      optionsHindi: ["यम (Yama)", "नियम (Niyama)", "आसन (Asana)", "प्राणायाम (Pranayama)"],
      optionsEnglish: ["Yama", "Niyama", "Asana", "Pranayama"],
      correctHindi: "यम (Yama)",
      correctEnglish: "Yama",
      explanationHindi: "पहला अंग यम है, जिसके अंतर्गत पांच सामाजिक व्रत आते हैं: अहिंसा, सत्य, अस्तेय, ब्रह्मचर्य और अपरिग्रह।",
      explanationEnglish: "Yama is the first limb of yoga, representing five social restraints: non-violence, truth, non-stealing, celibacy, and non-covetousness.",
      ref: "Yoga Science"
    },
    {
      textHindi: "श्वास और प्रश्वास की गति को नियंत्रित व संतुलित करने की क्रिया को योग में क्या कहते हैं?",
      textEnglish: "What is the science of breath regulation and control of life-force in Yoga called?",
      optionsHindi: ["प्राणायाम", "प्रत्याहार", "धारणा", "आसन"],
      optionsEnglish: ["Pranayama", "Pratyahara", "Dharana", "Asana"],
      correctHindi: "प्राणायाम",
      correctEnglish: "Pranayama",
      explanationHindi: "प्राण (जीवन ऊर्जा) और आयाम (विस्तार/नियंत्रण) मिलकर प्राणायाम कहलाता है, जो मन को स्थिर करता है।",
      explanationEnglish: "Pranayama is the fourth limb of Ashtanga Yoga, focusing on respiratory control to calm the mind.",
      ref: "Yoga Science"
    },
    {
      textHindi: "अष्टांग योग की वह अंतिम चरम अवस्था कौन सी है जिसमें जीवात्मा परमात्मा में लीन हो जाती है?",
      textEnglish: "What is the final, supreme limb of Ashtanga Yoga where the individual consciousness merges with the Divine?",
      optionsHindi: ["समाधि (Samadhi)", "ध्यान (Dhyana)", "धारणा (Dharana)", "प्रत्याहार (Pratyahara)"],
      optionsEnglish: ["Samadhi", "Dhyana", "Dharana", "Pratyahara"],
      correctHindi: "समाधि (Samadhi)",
      correctEnglish: "Samadhi",
      explanationHindi: "अष्टांग योग का आठवां और अंतिम सोपान समाधि है, जहां द्वैत समाप्त हो जाता है और पूर्ण शांति मिलती है।",
      explanationEnglish: "Samadhi is the ultimate state of spiritual absorption and complete liberation of the soul.",
      ref: "Yoga Science"
    }
  ];

  const meditationTemplates = [
    {
      textHindi: "मानव शरीर के सूक्ष्म तंत्र में रीढ़ के आधार पर कौन सा ऊर्जा चक्र (प्रथम चक्र) स्थित है?",
      textEnglish: "In the subtle energy system of the human body, which chakra is located at the base of the spine?",
      optionsHindi: ["मूलाधार चक्र (Muladhara)", "स्वाधिष्ठान चक्र", "मणिपुर चक्र", "अनाहत चक्र"],
      optionsEnglish: ["Muladhara Chakra (Root)", "Svadhisthana Chakra", "Manipura Chakra", "Anahata Chakra"],
      correctHindi: "मूलाधार चक्र (Muladhara)",
      correctEnglish: "Muladhara Chakra (Root)",
      explanationHindi: "रीढ़ के सबसे निचले हिस्से में मूलाधार चक्र (चार पंखुड़ी वाला कमल) स्थित है, जो पृथ्वी तत्व का प्रतीक है।",
      explanationEnglish: "The Muladhara (Root) Chakra resides at the base of the spine, governing stability and physical foundation.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "मानव शरीर में कुल कितने मुख्य आध्यात्मिक ऊर्जा केंद्र (चक्र) रीढ़ के समानांतर स्थित हैं?",
      textEnglish: "How many primary spiritual energy centers (Chakras) are situated along the spinal cord?",
      optionsHindi: ["7", "108", "12", "5"],
      optionsEnglish: ["7", "108", "12", "5"],
      correctHindi: "7",
      correctEnglish: "7",
      explanationHindi: "सूक्ष्म शरीर में मुख्य रूप से सात चक्र हैं: मूलाधार, स्वाधिष्ठान, मणिपुर, अनाहत, विशुद्ध, आज्ञा और सहस्रार।",
      explanationEnglish: "There are 7 primary chakras representing different stages of consciousness in the human subtle system.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "मस्तक के शिखर पर (ब्रह्मरंध्र में) स्थित हजार पंखुड़ियों वाले दिव्य चक्र का क्या नाम है?",
      textEnglish: "What is the name of the thousand-petalled divine chakra located at the crown of the head?",
      optionsHindi: ["सहस्रार चक्र (Sahasrara)", "आज्ञा चक्र", "विशुद्ध चक्र", "अनाहत चक्र"],
      optionsEnglish: ["Sahasrara Chakra (Crown)", "Ajna Chakra", "Vishuddha Chakra", "Anahata Chakra"],
      correctHindi: "सहस्रार चक्र (Sahasrara)",
      correctEnglish: "Sahasrara Chakra (Crown)",
      explanationHindi: "मस्तिष्क के शीर्ष भाग पर सहस्रार चक्र स्थित है, जो अनंत शांति और परमात्मा से पूर्ण मिलन का बिंदु है।",
      explanationEnglish: "The Sahasrara (Crown) Chakra is the destination of spiritual ascent, representing cosmic unity.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "भूमध्य (दोनों भौहों के बीच) में स्थित चक्र का क्या नाम है जिसे तीसरा नेत्र या विवेक का केंद्र भी कहते हैं?",
      textEnglish: "What is the name of the chakra located between the eyebrows, often called the third eye or intuition center?",
      optionsHindi: ["आज्ञा चक्र (Ajna Chakra)", "विशुद्ध चक्र", "अनाहत चक्र", "मणिपुर चक्र"],
      optionsEnglish: ["Ajna Chakra (Third Eye)", "Vishuddha Chakra", "Anahata Chakra", "Manipura Chakra"],
      correctHindi: "आज्ञा चक्र (Ajna Chakra)",
      correctEnglish: "Ajna Chakra (Third Eye)",
      explanationHindi: "दोनों भौहों के मध्य आज्ञा चक्र (दो पंखुड़ी वाला) स्थित है, जो मन की एकाग्रता और विवेक का मुख्य स्थान है।",
      explanationEnglish: "The Ajna Chakra is situated between the eyebrows, acting as the seed of intuition, wisdom, and focus.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "सनातन परंपरा में ध्यान and एकाग्रता के लिए किस अनादि ध्वनि (मंत्रराज) को सर्वोत्तम माना गया है?",
      textEnglish: "In Sanatan tradition, which primordial sound (Mantra) is considered supreme for meditation and chanting?",
      optionsHindi: ["ॐ (प्रणव - Om)", "ह्रीं", "क्लीं", "सोऽहम्"],
      optionsEnglish: ["Om (Pranava)", "Hreem", "Kleem", "Soham"],
      correctHindi: "ॐ (प्रणव - Om)",
      correctEnglish: "Om (Pranava)",
      explanationHindi: "ॐ (ओम्/प्रणव) सृष्टि की अनादि और अनाहत ध्वनि है, जो ध्यान लगाने और मानसिक शांति पाने का अचूक साधन है।",
      explanationEnglish: "Om is the sacred primordial vibration of the cosmos, representing the supreme Absolute.",
      ref: "Meditation & Dhyana"
    }
  ];

  const sanskritTemplates = [
    {
      textHindi: "देववाणी कही जाने वाली संस्कृत भाषा मुख्य रूप से किस लिपि में लिखी जाती है?",
      textEnglish: "The Sanskrit language, known as the language of Gods, is primarily written in which script?",
      optionsHindi: ["देवनागरी (Devanagari)", "ब्राह्मी", "शारदा", "गुरुमुखी"],
      optionsEnglish: ["Devanagari", "Brahmi", "Sharada", "Gurmukhi"],
      correctHindi: "देवनागरी (Devanagari)",
      correctEnglish: "Devanagari",
      explanationHindi: "संसार की सर्वाधिक वैज्ञानिक लिपि देवनागरी में ही मुख्यतः संस्कृत भाषा का लेखन कार्य होता है।",
      explanationEnglish: "Sanskrit is primarily recorded and published in the highly structured Devanagari script.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संसार के प्रथम व्यवस्थित व्याकरण ग्रंथ 'अष्टाध्यायी' के महान रचयिता कौन हैं?",
      textEnglish: "Who is the legendary composer of the world's first systematic grammar textbook 'Ashtadhyayi'?",
      optionsHindi: ["महर्षि पाणिनि", "महर्षि पतंजलि", "महर्षि यास्क", "महर्षि व्यास"],
      optionsEnglish: ["Maharishi Panini", "Maharishi Patanjali", "Maharishi Yaska", "Maharishi Vyasa"],
      correctHindi: "महर्षि पाणिनि",
      correctEnglish: "Maharishi Panini",
      explanationHindi: "महर्षि पाणिनि ने संस्कृत व्याकरण को सूत्रबद्ध करते हुए ८ अध्यायों वाली अष्टाध्यायी की रचना की।",
      explanationEnglish: "Sage Panini composed the Ashtadhyayi, introducing the most advanced grammatical rules for Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संस्कृत साहित्य का 'आदिकाव्य' (प्रथम महाकाव्य) किस ग्रंथ को माना जाता है?",
      textEnglish: "Which sacred text is universally revered as the 'Adi Kavya' (the first epic poem) in Sanskrit literature?",
      optionsHindi: ["वाल्मीकि रामायण", "महाभारत", "रघुवंशम", "श्रीमद्भगवद्गीता"],
      optionsEnglish: ["Valmiki Ramayana", "Mahabharata", "Raghuvansham", "Bhagavad Gita"],
      correctHindi: "वाल्मीकि रामायण",
      correctEnglish: "Valmiki Ramayana",
      explanationHindi: "महर्षि वाल्मीकि द्वारा रचित रामायण को संस्कृत का प्रथम महाकाव्य और वाल्मीकि जी को आदिकवि माना जाता है।",
      explanationEnglish: "The Valmiki Ramayana is hailed as the Adi Kavya because it was the first composed epic in Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "'संस्कृत' शब्द का वास्तविक अर्थ क्या होता है?",
      textEnglish: "What is the true and literal meaning of the word 'Sanskrit'?",
      optionsHindi: ["परिष्कृत, शुद्ध और सुसंस्कृत", "देवताओं द्वारा बोली जाने वाली", "अत्यंत कठिन भाषा", "प्राचीन बोली"],
      optionsEnglish: ["Refined, purified, and polished", "Spoken by deities", "Extremely difficult language", "Ancient dialect"],
      correctHindi: "परिष्कृत, शुद्ध और सुसंस्कृत",
      correctEnglish: "Refined, purified, and polished",
      explanationHindi: "संस्कृत का अर्थ है 'सम्' (भलीभांति) + 'कृत' (की हुई), अर्थात् जो पूर्ण रूप से शुद्ध और व्याकरण सम्मत हो।",
      explanationEnglish: "Sanskrit literally translates to refined, systematic, purified, and intellectually polished language.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संसार के कल्याण हेतु प्रसिद्ध प्रार्थना 'सर्वे भवन्तु सुखिनः' किस प्राचीन उपनिषद से लिया गया है?",
      textEnglish: "The universal peace prayer 'Sarve Bhavantu Sukhinah' is part of which ancient Upanishadic tradition?",
      optionsHindi: ["बृहदारण्यक उपनिषद", "कठ उपनिषद", "माण्डूक्य उपनिषद", "ईश उपनिषद"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Isha Upanishad"],
      correctHindi: "बृहदारण्यक उपनिषद",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "यह शांति पाठ बृहदारण्यक उपनिषद परंपरा से जुड़ा है, जो 'सभी सुखी और नीरोगी रहें' का पावन संदेश देता है।",
      explanationEnglish: "This ancient prayer for universal happiness and well-being belongs to the Brihadaranyaka Upanishad.",
      ref: "Sanskrit & Shlokas"
    }
  ];

  const generalTemplates = [
    {
      textHindi: "सनातन धर्म के अंतर्गत 'त्रिदेव' की संकल्पना किन तीन प्रमुख देवताओं का प्रतिनिधित्व करती है?",
      textEnglish: "Under Sanatan Dharma, the concept of 'Trideva' represents which three principal deities?",
      optionsHindi: ["ब्रह्मा, विष्णु, महेश (शिव)", "राम, कृष्ण, हनुमान", "इंद्र, वरुण, अग्नि", "गणेश, कार्तिकेय, शिव"],
      optionsEnglish: ["Brama, Vishnu, and Mahesh (Shiva)", "Rama, Krishna, and Hanuman", "Indra, Varuna, and Agni", "Ganesha, Kartikeya, and Shiva"],
      correctHindi: "ब्रह्मा, विष्णु, महेश (शिव)",
      correctEnglish: "Brama, Vishnu, and Mahesh (Shiva)",
      explanationHindi: "त्रिदेव सृष्टि की तीन प्रक्रियाओं के स्वामी हैं: ब्रह्मा (सृष्टि कर्ता), विष्णु (पालन कर्ता) और महेश (संहार कर्ता)।",
      explanationEnglish: "The Trimurti/Trideva consists of Brahma the Creator, Vishnu the Preserver, and Shiva the Destroyer.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "सनातन धर्म के अटल 'कर्म सिद्धांत' के अनुसार मनुष्य को प्राप्त होने वाले सुख-दुख का मुख्य कारण क्या है?",
      textEnglish: "According to the immutable 'Law of Karma' in Sanatan Dharma, what is the primary cause of joy and sorrow?",
      optionsHindi: ["मनुष्य के स्वयं के पूर्व और वर्तमान कर्म", "ग्रहों की चाल", "भाग्य का अचानक बदलना", "अन्य व्यक्तियों का व्यवहार"],
      optionsEnglish: ["One's own past and present actions", "The planetary transits", "Sudden changes in luck/destiny", "The behavior of other people"],
      correctHindi: "मनुष्य के स्वयं के पूर्व और वर्तमान कर्म",
      correctEnglish: "One's own past and present actions",
      explanationHindi: "कर्म सिद्धांत के अनुसार 'जैसा बोओगे, वैसा काटोगे' - अर्थात् हर क्रिया की समान और विपरीत प्रतिक्रिया होती है।",
      explanationEnglish: "The Law of Karma dictates that every individual is solely responsible for their actions and experiences.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "हिंदू घरों के प्रवेश द्वार पर बनाया जाने वाला कल्याण, शांति और समृद्धि का पावन दिव्य प्रतीक कौन सा है?",
      textEnglish: "Which sacred divine symbol of peace, auspiciousness, and prosperity is drawn on Hindu entrances?",
      optionsHindi: ["स्वस्तिक (Swastika)", "त्रिशूल", "शंख", "कमल"],
      optionsEnglish: ["Swastika", "Trishul", "Shankha", "Lotus"],
      correctHindi: "स्वस्तिक (Swastika)",
      correctEnglish: "Swastika",
      explanationHindi: "स्वस्तिक 'सु' (शुभ) + 'अस्ति' (कल्याण/अस्तित्व) का प्रतीक है, जो चारों दिशाओं से कल्याण को आकर्षित करता है।",
      explanationEnglish: "The Swastika is an ancient Vedic symbol representing solar energy, peace, and spiritual fortune.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "आध्यात्मिक मान्यताओं के अनुसार परम पावन पतितपावनी गंगा नदी का पृथ्वी पर अवतरण किसके मस्तक पर हुआ था?",
      textEnglish: "According to spiritual traditions, on whose head did the celestial River Ganga first land during her descent?",
      optionsHindi: ["भगवान शिव की जटाओं में", "भगवान विष्णु के चरणों में", "राजा भगीरथ के रथ पर", "हिमालय के शिखरों पर"],
      optionsEnglish: ["Lord Shiva's matted hair", "Lord Vishnu's feet", "King Bhagiratha's chariot", "The peaks of Himalayas"],
      correctHindi: "भगवान शिव की जटाओं में",
      correctEnglish: "Lord Shiva's matted hair",
      explanationHindi: "गंगा के तीव्र वेग को पृथ्वी सहन नहीं कर सकती थी, इसलिए भगवान शिव ने उन्हें अपनी जटाओं में रोककर शांत किया था।",
      explanationEnglish: "Lord Shiva absorbed the intense force of descending Ganga in his locks to save the Earth from destruction.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "किस अनुपम धर्मग्रंथ को संपूर्ण उपनिषदों और वेदों का अमूल्य निचोड़ (सार) माना गया है?",
      textEnglish: "Which unparalleled scripture is recognized as the supreme summary (nectar) of all Vedas and Upanishads?",
      optionsHindi: ["श्रीमद्भगवद्गीता (Bhagavad Gita)", "रामचरितमानस", "शिव पुराण", "मनुस्मृति"],
      optionsEnglish: ["Bhagavad Gita", "Ramcharitmanas", "Shiva Purana", "Manusmriti"],
      correctHindi: "श्रीमद्भगवद्गीता (Bhagavad Gita)",
      correctEnglish: "Bhagavad Gita",
      explanationHindi: "गीता को 'गीतोपनिषद' भी कहते हैं, जिसे सभी उपनिषद रूपी गायों के दुग्ध रूपी अमृत सार के रूप में जाना जाता है।",
      explanationEnglish: "The Bhagavad Gita is hailed as the essence of Upanishadic literature, containing direct words of Lord Krishna.",
      ref: "General Spiritual Knowledge"
    }
  ];

  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let templates = mahabharataTemplates; // Default fallback to mahabharata
  const lower = (subjectId || "").toLowerCase();

  if (lower.includes("mahabharata") || lower.includes("bharat")) templates = mahabharataTemplates;
  else if (lower.includes("shiv_puran")) templates = shivPuranTemplates;
  else if (lower.includes("vishnu_puran")) templates = vishnuPuranTemplates;
  else if (lower.includes("bhagavatam") || lower.includes("bhagwat")) templates = bhagavatamTemplates;
  else if (lower.includes("vedas") || lower.includes("ved")) templates = vedasTemplates;
  else if (lower.includes("upanishad")) templates = upanishadsTemplates;
  else if (lower.includes("saint") || lower.includes("guru")) templates = saintsTemplates;
  else if (lower.includes("temple")) templates = templesTemplates;
  else if (lower.includes("culture")) templates = cultureTemplates;
  else if (lower.includes("festival")) templates = festivalsTemplates;
  else if (lower.includes("yoga")) templates = yogaTemplates;
  else if (lower.includes("meditation") || lower.includes("dhyan")) templates = meditationTemplates;
  else if (lower.includes("sanskrit")) templates = sanskritTemplates;
  else if (lower.includes("general")) templates = generalTemplates;

  const shuffledTemplates = shuffleArray(templates);
  const qList: any[] = [];

  for (let i = 0; i < 10; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const originalOptions = isEnglish ? template.optionsEnglish : template.optionsHindi;
    const shuffledOptions = shuffleArray(originalOptions);

    qList.push({
      text: isEnglish ? template.textEnglish : template.textHindi,
      options: shuffledOptions,
      correctAnswer: isEnglish ? template.correctEnglish : template.correctHindi,
      explanation: isEnglish ? template.explanationEnglish : template.explanationHindi,
      scriptureRef: template.ref
    });
  }

  return qList;
};

export const QuizPlay = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData } = useAuthStore();
  const haptics = useHaptics();

  // Loaders & database states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz progression states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120); // standard fallback
  const [baseCompletedCount, setBaseCompletedCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Real-time progressive feedback for Chapters
  const currentRoundAnsweredCount = React.useMemo(() => {
    return questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null && (!Array.isArray(selectedAnswers[q.id]) || (selectedAnswers[q.id] as string[]).length > 0)).length;
  }, [questions, selectedAnswers]);

  const overallChapterProgress = React.useMemo(() => {
    if (!quizId || !quizId.startsWith('chapter_play_')) return null;
    const count = Math.min(baseCompletedCount + currentRoundAnsweredCount, 25);
    return {
      count,
      percent: Math.round((count / 25) * 100)
    };
  }, [quizId, baseCompletedCount, currentRoundAnsweredCount]);

  // Intercept and prevent back navigation/gesture to avoid progress loss
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      setShowExitConfirm(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleConfirmExit = () => {
    window.removeEventListener('popstate', () => {});
    goBack('/quiz');
  };

  // Load quiz, questions, and existing saved progress
  useEffect(() => {
    if (!quizId || !user) return;

    setLoading(true);

    // Strict 4-second loading timeout to prevent getting stuck forever on slow/dead API/Firestore
    const loadingTimeout = setTimeout(() => {
      console.warn("[QuizPlay Timeout] Quiz loading exceeded 4 seconds, force-activating fallbacks.");
      
      const parsedSubjectId = 'hindu_dharma';
      const finalQuizId = quizId || 'ai_mixed';
      const fallbackQuizObj = {
        id: finalQuizId,
        subjectId: parsedSubjectId,
        name: 'Divine Wisdom Challenge',
        description: 'An adaptive scriptural practice session to deepen your wisdom.',
        coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
        type: "mixed",
        timeLimit: 120,
        questionsCount: 10,
        points: 100,
        isPublished: true,
        isTodayQuiz: false
      } as unknown as Quiz;

      const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
      const fbQs = fallbacks.fallbackQuestions.slice(0, 10).map((q, i) => ({
        id: `fallback_timeout_${i}`,
        questionId: `fallback_timeout_${i}`,
        quizId: finalQuizId,
        subjectId: parsedSubjectId,
        chapterId: "General",
        language: selectedLang,
        text: q.text,
        type: "mcq",
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        scriptureRef: q.scriptureRef || "",
        chapter: "General",
        verse: `${i + 1}`
      })) as unknown as Question[];

      setQuiz(fallbackQuizObj);
      setTimeLeft(120);
      setQuestions(fbQs);
      setLoading(false);
    }, 4000);

    const loadQuizData = async () => {
      try {
        let quizData: Quiz | null = null;
        let questionsList: Question[] = [];
        let finalQuizId = quizId;

        const isChapterPlay = quizId.startsWith('chapter_play_');

        if (isChapterPlay) {
          const parts = quizId.substring("chapter_play_".length).split("_chapter_");
          const subjectId = parts[0];
          const chapterId = `chapter_${parts[1]}`;
          
          let chapterName = `Chapter ${chapterId}`;
          const chaptersList = SUBJECT_CHAPTERS[subjectId] || [];
          const chapterObj = chaptersList.find(c => c.id === chapterId);
          if (chapterObj) {
            chapterName = chapterObj.nameEnglish;
          } else {
            try {
              const chapSnap = await getDoc(doc(db, 'quiz_chapters', `${subjectId}_${chapterId}`));
              if (chapSnap.exists()) {
                chapterName = chapSnap.data().nameEnglish;
              }
            } catch (e) {
              console.warn("Failed to fetch dynamic chapter name:", e);
            }
          }
          
          let response: Response | null = null;
          try {
            response = await fetch('/api/quiz/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'chapter',
                subjectId,
                chapterId,
                chapterName,
                language: localStorage.getItem('hari_quiz_language') || 'Hindi',
                userId: user.uid
              })
            });
          } catch (fetchErr) {
            console.warn("Network error during chapter generation, using client fallback:", fetchErr);
          }

          if (response && response.ok) {
            const result = await response.json();
            quizData = result.quiz as Quiz;
            questionsList = result.questions as Question[];
          } else {
            console.warn("AI chapter generation endpoint failed or was unreachable. Synthesizing client-side fallback quiz.");
            quizData = {
              id: `chapter_play_${subjectId}_${chapterId}`,
              subjectId,
              chapterId,
              name: chapterName || `Chapter ${chapterId}`,
              description: `Comprehensive practice module for ${chapterName || chapterId}.`,
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: "chapter",
              timeLimit: 300,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;

            const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
            let matchingFallbacks = fallbacks.fallbackQuestions.filter(q => q.subjectId === subjectId);
            if (matchingFallbacks.length === 0) {
              matchingFallbacks = getClientFallbackQuestions(subjectId, chapterId, selectedLang);
            }

            questionsList = matchingFallbacks.map((q, i) => ({
              id: `fallback_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${i}`,
              questionId: `fallback_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${i}`,
              quizId: `chapter_quiz_${subjectId}_${chapterId}`,
              subjectId,
              chapterId,
              language: selectedLang,
              text: q.text,
              type: "mcq",
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: chapterId,
              verse: `${i + 1}`
            })) as unknown as Question[];
          }
          finalQuizId = quizData.id;

          let completedQuestionsCount = 0;
          try {
            const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
            const chapProgSnap = await getDoc(chapProgRef);
            completedQuestionsCount = chapProgSnap.exists() ? (chapProgSnap.data().completedQuestionsCount || 0) : 0;
            if (completedQuestionsCount >= 25) {
              completedQuestionsCount = 0;
              await setDoc(chapProgRef, { completedQuestionsCount: 0, isCompleted: false }, { merge: true });
              await setDoc(doc(db, 'userStats', user.uid, 'quiz_progress', finalQuizId), {
                isCompleted: false,
                selectedAnswers: {},
                bookmarks: [],
                currentQuestionIndex: 0,
                lastActive: serverTimestamp()
              }, { merge: true });
            }
          } catch (dbErr) {
            console.warn("Could not load chapter progress:", dbErr);
          }

          const roundStartIdx = Math.floor(completedQuestionsCount / 10) * 10;
          setBaseCompletedCount(roundStartIdx);
          questionsList = questionsList.slice(roundStartIdx, roundStartIdx + 10);
        } else if (quizId === 'ai_mixed' || quizId.startsWith('ai_subject_')) {
          const userSelectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
          let reqBody: any = {
            language: userSelectedLang,
            userId: user.uid
          };
          if (quizId === 'ai_mixed') {
            reqBody.type = 'mixed';
          } else {
            const parsedSubjectId = quizId.replace('ai_subject_', '');
            reqBody.type = 'subject';
            reqBody.subjectId = parsedSubjectId;
          }

          let response: Response | null = null;
          try {
            response = await fetch('/api/quiz/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });
          } catch (fetchErr) {
            console.warn("Network error during AI generation:", fetchErr);
          }

          if (response && response.ok) {
            const result = await response.json();
            quizData = result.quiz as Quiz;
            questionsList = result.questions as Question[];
          } else {
            const parsedSubjectId = quizId.startsWith('ai_subject_') ? quizId.replace('ai_subject_', '') : 'ai_mixed';
            quizData = {
              id: quizId,
              subjectId: parsedSubjectId,
              name: quizId === 'ai_mixed' ? "Mixed Spiritual Practice" : `${parsedSubjectId.replace(/_/g, ' ').toUpperCase()} Practice Session`,
              description: "High-quality offline fallback practice module.",
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: quizId === 'ai_mixed' ? "mixed" : "subject",
              timeLimit: 180,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;

            let matchingFallbacks = fallbacks.fallbackQuestions;
            if (quizId.startsWith('ai_subject_')) {
              matchingFallbacks = fallbacks.fallbackQuestions.filter(q => q.subjectId === parsedSubjectId);
              if (matchingFallbacks.length === 0) {
                matchingFallbacks = fallbacks.fallbackQuestions;
              }
            }

            questionsList = matchingFallbacks.slice(0, 10).map((q, i) => ({
              id: `fallback_ai_${parsedSubjectId}_${i}`,
              questionId: `fallback_ai_${parsedSubjectId}_${i}`,
              quizId: quizId,
              subjectId: parsedSubjectId,
              chapterId: "General",
              language: userSelectedLang,
              text: q.text,
              type: "mcq",
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: "General",
              verse: `${i + 1}`
            })) as unknown as Question[];
          }
          finalQuizId = quizData.id;
        } else {
          try {
            const quizSnap = await getDoc(doc(db, 'quiz_quizzes', quizId));
            if (quizSnap.exists()) {
              quizData = { id: quizSnap.id, ...quizSnap.data() } as Quiz;
            } else {
              const fb = fallbacks.fallbackQuizzes.find(q => q.id === quizId);
              if (fb) quizData = fb as unknown as Quiz;
            }
          } catch (e) {
            const fb = fallbacks.fallbackQuizzes.find(q => q.id === quizId);
            if (fb) quizData = fb as unknown as Quiz;
          }

          if (!quizData) {
            quizData = {
              id: quizId || 'ai_mixed',
              subjectId: 'hindu_dharma',
              name: 'Divine Wisdom Session',
              description: 'A personalized spiritual practice to deepen your scriptural wisdom.',
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: "mixed",
              timeLimit: 180,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;
          }

          try {
            const qRef = collection(db, 'quiz_questions');
            const qQuery = query(qRef, where('quizId', '==', quizId));
            const qSnap = await getDocs(qQuery);
            qSnap.forEach(docSnap => {
              questionsList.push({ id: docSnap.id, ...docSnap.data() } as Question);
            });
          } catch (e) {
            console.warn("Questions fetch issue:", e);
          }

          if (questionsList.length === 0) {
            const fbQs = fallbacks.fallbackQuestions.filter(q => q.quizId === quizId || q.subjectId === quizData?.subjectId);
            if (fbQs.length > 0) {
              questionsList = fbQs as unknown as Question[];
            } else {
              questionsList = fallbacks.fallbackQuestions.slice(0, 10) as unknown as Question[];
            }
          }
        }

        if (quizData && questionsList.length < 10) {
          const countNeeded = 10 - questionsList.length;
          try {
            const extraRes = await fetch('/api/quiz/generate-additional', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quizId: finalQuizId,
                subjectId: quizData.subjectId || 'hindu_dharma',
                quizName: quizData.name,
                count: countNeeded,
                existingQuestions: questionsList.map(q => q.text)
              })
            });
            if (extraRes.ok) {
              const extraData = await extraRes.json();
              if (Array.isArray(extraData.questions)) {
                questionsList = [...questionsList, ...extraData.questions];
              }
            }
          } catch (e) {
            console.error("Failed to generate additional questions:", e);
          }
        }

        // Post-load guaranteed fallback if questions are still empty
        if (!questionsList || questionsList.length === 0) {
          console.warn("[QuizPlay] Empty questions list loaded, resolving with fallbacks.");
          const parsedSubjectId = (quizData && quizData.subjectId) || 'hindu_dharma';
          let fbQs = fallbacks.fallbackQuestions.filter(q => q.subjectId === parsedSubjectId);
          if (fbQs.length === 0) {
            fbQs = fallbacks.fallbackQuestions;
          }
          const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
          questionsList = fbQs.slice(0, 10).map((q, i) => ({
            id: `fallback_q_safe_${parsedSubjectId}_${selectedLang.toLowerCase()}_${i}`,
            questionId: `fallback_q_safe_${parsedSubjectId}_${selectedLang.toLowerCase()}_${i}`,
            quizId: finalQuizId || 'ai_mixed',
            subjectId: parsedSubjectId,
            chapterId: "General",
            language: selectedLang,
            text: q.text,
            type: "mcq",
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            scriptureRef: q.scriptureRef || "",
            chapter: "General",
            verse: `${i + 1}`
          })) as unknown as Question[];
        }

        clearTimeout(loadingTimeout);

        setQuiz(quizData);
        setTimeLeft((quizData && quizData.timeLimit) || 120);
        setQuestions(questionsList);

        const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', finalQuizId);
        const progSnap = await getDoc(progRef);
        if (progSnap.exists()) {
          const progData = progSnap.data() as QuizProgress;
          if (progData.isCompleted) {
            setSelectedAnswers({});
            setBookmarks([]);
            setCurrentIndex(0);
          } else {
            setSelectedAnswers(progData.selectedAnswers || {});
            setBookmarks(progData.bookmarks || []);
            if (progData.currentQuestionIndex < questionsList.length) {
              setCurrentIndex(progData.currentQuestionIndex);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        clearTimeout(loadingTimeout);
        console.error("Error loading play quiz data:", error);
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, user]);

  useEffect(() => {
    if (loading || !quiz || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, quiz, isSubmitting]);

  const saveProgressToFirestore = async (
    updatedAnswers: Record<string, string | string[]>,
    updatedBookmarks: string[],
    newIndex: number
  ) => {
    const activeQuizId = quiz ? quiz.id : quizId;
    if (!user || !activeQuizId) return;
    try {
      const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', activeQuizId);
      await setDoc(progRef, {
        id: activeQuizId,
        quizId: activeQuizId,
        currentQuestionIndex: newIndex,
        selectedAnswers: updatedAnswers,
        bookmarks: updatedBookmarks,
        isCompleted: false,
        lastActive: serverTimestamp()
      }, { merge: true });

      if (activeQuizId.startsWith('chapter_play_')) {
        const parts = activeQuizId.substring("chapter_play_".length).split("_chapter_");
        const subjectId = parts[0];
        const chapterId = `chapter_${parts[1]}`;
        const currentRoundAnsweredCount = questions.filter(q => updatedAnswers[q.id] !== undefined && updatedAnswers[q.id] !== null && (!Array.isArray(updatedAnswers[q.id]) || (updatedAnswers[q.id] as string[]).length > 0)).length;
        const totalCompleted = Math.min(baseCompletedCount + currentRoundAnsweredCount, 25);
        
        const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
        await setDoc(chapProgRef, {
          completedQuestionsCount: totalCompleted,
          lastActive: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    haptics?.hapticSelection?.();

    const questionId = currentQuestion.id;
    let newAnswers = { ...selectedAnswers };

    if (currentQuestion.type === 'multiple_correct') {
      const currentSelection = (selectedAnswers[questionId] as string[]) || [];
      if (currentSelection.includes(option)) {
        newAnswers[questionId] = currentSelection.filter(item => item !== option);
      } else {
        newAnswers[questionId] = [...currentSelection, option];
      }
    } else {
      newAnswers[questionId] = option;
    }

    setSelectedAnswers(newAnswers);
    saveProgressToFirestore(newAnswers, bookmarks, currentIndex);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      saveProgressToFirestore(selectedAnswers, bookmarks, newIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      saveProgressToFirestore(selectedAnswers, bookmarks, newIdx);
    }
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;
    let newBookmarks = [...bookmarks];

    if (newBookmarks.includes(questionId)) {
      newBookmarks = newBookmarks.filter(id => id !== questionId);
    } else {
      newBookmarks.push(questionId);
    }

    setBookmarks(newBookmarks);
    saveProgressToFirestore(selectedAnswers, newBookmarks, currentIndex);
  };

  const handleSubmitQuiz = async (timedOut = false) => {
    if (isSubmitting || !user || !quiz) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const evaluationAnswers: Record<string, { selected: string | string[]; isCorrect: boolean }> = {};

      questions.forEach((q) => {
        const selected = selectedAnswers[q.id];
        if (!selected || (Array.isArray(selected) && selected.length === 0)) {
          skippedCount++;
          evaluationAnswers[q.id] = { selected: selected || '', isCorrect: false };
        } else {
          let isCorrect = false;
          if (Array.isArray(q.correctAnswer)) {
            const selArray = Array.isArray(selected) ? selected : [selected];
            isCorrect = q.correctAnswer.length === selArray.length && 
                        q.correctAnswer.every(val => selArray.includes(val));
          } else {
            isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          }

          if (isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }

          evaluationAnswers[q.id] = { selected, isCorrect };
        }
      });

      const percentage = Math.round((correctCount / questions.length) * 100);
      const calculatedScore = Math.round((correctCount / questions.length) * quiz.points);

      const isChapterPlay = quiz.id.startsWith('chapter_play_');
      let sessionId = `PLAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      let certificateId: string | null = null;
      let historyPayload: QuizHistory;

      if (isChapterPlay) {
        const parts = quiz.id.substring("chapter_play_".length).split("_chapter_");
        const subjectId = parts[0];
        const chapterId = `chapter_${parts[1]}`;

        const subSnap = await getDoc(doc(db, 'quiz_subjects', subjectId));
        const subName = subSnap.exists() ? (subSnap.data().name || subjectId) : 'Spiritual Subject';

        const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
        const chapProgSnap = await getDoc(chapProgRef);

        const roundNum = Math.floor(baseCompletedCount / 10) + 1;
        sessionId = `PLAY-${subjectId.toUpperCase()}-${chapterId.toUpperCase()}-R${roundNum}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        historyPayload = {
          id: sessionId,
          userId: user.uid,
          subjectId: subjectId,
          subjectName: subName,
          quizId: quiz.id,
          quizName: `${quiz.name} - Round ${roundNum}`,
          completedAt: new Date().toISOString(),
          score: calculatedScore,
          percentage,
          timeTaken: quiz.timeLimit - timeLeft,
          totalQuestions: questions.length,
          correctCount,
          wrongCount,
          skippedCount,
          answers: evaluationAnswers,
          certificateId: null,
          language: localStorage.getItem('hari_quiz_language') || 'Hindi',
          userDisplayName: user.displayName || 'Devoted Seeker'
        };
        await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);

        const newCompletedCount = Math.min(baseCompletedCount + questions.length, 25);
        const isChapterFullyCompleted = newCompletedCount >= 25;

        const prevCorrect = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().correctCount || 0) : 0;
        const prevTotalScore = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().totalScore || 0) : 0;
        const prevTimeTaken = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().timeTaken || 0) : 0;
        const prevAttemptsCount = chapProgSnap.exists() ? (chapProgSnap.data().attemptsCount || 0) : 0;
        const prevBestAccuracy = chapProgSnap.exists() ? (chapProgSnap.data().bestAccuracy || 0) : 0;
        const prevHighestScore = chapProgSnap.exists() ? (chapProgSnap.data().highestScore || 0) : 0;

        const newCorrect = prevCorrect + correctCount;
        const roundTimeTaken = quiz.timeLimit - timeLeft;
        const newTimeTaken = prevTimeTaken + roundTimeTaken;
        const newTotalScore = prevTotalScore + calculatedScore;
        const overallAccuracy = Math.round((newCorrect / 25) * 100);

        await setDoc(chapProgRef, {
          id: `${subjectId}_${chapterId}`,
          subjectId,
          chapterId,
          chapterName: quiz.name,
          completedQuestionsCount: newCompletedCount,
          isCompleted: isChapterFullyCompleted,
          correctCount: newCorrect,
          totalQuestions: 25,
          totalScore: newTotalScore,
          timeTaken: newTimeTaken,
          lastActive: serverTimestamp(),
          attemptsCount: prevAttemptsCount + (isChapterFullyCompleted ? 1 : 0),
          bestAccuracy: isChapterFullyCompleted ? Math.max(prevBestAccuracy, overallAccuracy) : prevBestAccuracy,
          highestScore: isChapterFullyCompleted ? Math.max(prevHighestScore, newTotalScore) : prevHighestScore
        }, { merge: true });

        if (isChapterFullyCompleted && overallAccuracy >= 60) {
          certificateId = `HP-CERT-${subjectId.toUpperCase()}-${chapterId.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          
          const certQuery = query(
            collection(db, 'certificates'),
            where('userId', '==', user.uid),
            where('subjectId', '==', subjectId),
            where('chapterId', '==', chapterId)
          );
          const certSnap = await getDocs(certQuery);
          if (!certSnap.empty) {
            certificateId = certSnap.docs[0].id;
          } else {
            const timeSpent = quiz.timeLimit - timeLeft;
            const certPayload = {
              id: certificateId,
              certificateId: certificateId,
              certificateNumber: certificateId,
              userId: user.uid,
              uid: user.uid,
              quizId: `chapter_play_${subjectId}_${chapterId}`,
              quizName: `${subName} - ${quiz.name}`,
              subjectId,
              subject: subName,
              subjectName: subName,
              chapterId,
              chapter: quiz.name || chapterId,
              userName: user.displayName || userData?.name || 'Devotee',
              score: newTotalScore,
              percentage: overallAccuracy,
              accuracy: overallAccuracy,
              completionTime: timeSpent,
              timeTaken: timeSpent,
              generatedDate: new Date().toLocaleDateString('en-CA'),
              completionDate: new Date().toLocaleDateString('en-CA'),
              completedAt: new Date().toISOString(),
              createdTime: new Date().toISOString(),
              pngUrl: "",
              pdfUrl: "",
              certificateImageUrl: "",
              rank: 1,
              status: "issued"
            };

            await setDoc(doc(db, 'userStats', user.uid, 'certificates', certificateId), certPayload);
            await setDoc(doc(db, 'certificates', certificateId), certPayload);

            historyPayload.certificateId = certificateId;
            await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);
          }
        }
      } else {
        certificateId = percentage >= 60 
          ? `HP-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` 
          : null;

        historyPayload = {
          id: sessionId,
          userId: user.uid,
          subjectId: quiz.subjectId,
          subjectName: quiz.name || 'Spiritual Quiz',
          quizId: quiz.id,
          quizName: quiz.name,
          completedAt: new Date().toISOString(),
          score: calculatedScore,
          percentage,
          timeTaken: quiz.timeLimit - timeLeft,
          totalQuestions: questions.length,
          correctCount,
          wrongCount,
          skippedCount,
          answers: evaluationAnswers,
          certificateId: certificateId || null,
          language: localStorage.getItem('hari_quiz_language') || 'Hindi',
          userDisplayName: user.displayName || 'Devoted Seeker'
        };
        await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);

        if (certificateId) {
          const timeSpent = quiz.timeLimit - timeLeft;
          const certPayload = {
            id: certificateId,
            certificateId: certificateId,
            certificateNumber: certificateId,
            userId: user.uid,
            uid: user.uid,
            quizId: quiz.id,
            quizName: quiz.name,
            subjectId: quiz.subjectId || 'hindu_dharma',
            subject: quiz.subjectId || 'hindu_dharma',
            subjectName: quiz.name || 'Spiritual',
            chapterId: "General",
            chapter: "General Quiz",
            userName: user.displayName || userData?.name || 'Devotee',
            score: calculatedScore,
            percentage,
            accuracy: percentage,
            completionTime: timeSpent,
            timeTaken: timeSpent,
            generatedDate: new Date().toLocaleDateString('en-CA'),
            completionDate: new Date().toLocaleDateString('en-CA'),
            completedAt: new Date().toISOString(),
            createdTime: new Date().toISOString(),
            pngUrl: "",
            pdfUrl: "",
            certificateImageUrl: "",
            rank: 1,
            status: "issued"
          };

          await setDoc(doc(db, 'userStats', user.uid, 'certificates', certificateId), certPayload);
          await setDoc(doc(db, 'certificates', certificateId), certPayload);
        }
      }

      const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', quiz.id);
      await setDoc(progRef, { isCompleted: true }, { merge: true });

      const historyRef = collection(db, 'userStats', user.uid, 'quiz_history');
      const histSnap = await getDocs(historyRef);
      const allHistory: QuizHistory[] = [];
      histSnap.forEach(d => {
        allHistory.push({ id: d.id, ...d.data() } as QuizHistory);
      });

      if (!allHistory.some(h => h.id === sessionId)) {
        allHistory.push(historyPayload);
      }

      let quizAllTimeScore = 0;
      let quizTotalCorrect = 0;
      let quizTotalWrong = 0;
      let quizTotalSkipped = 0;
      let quizTotalQuestions = 0;
      let totalTimeTaken = 0;

      allHistory.forEach(h => {
        quizAllTimeScore += (h.score || 0);
        quizTotalCorrect += (h.correctCount || 0);
        quizTotalWrong += (h.wrongCount || 0);
        quizTotalSkipped += (h.skippedCount || 0);
        quizTotalQuestions += (h.totalQuestions || 0);
        totalTimeTaken += (h.timeTaken || 0);
      });

      const quizTotalPlayed = allHistory.length;
      const quizAccuracy = quizTotalQuestions > 0 ? Math.round((quizTotalCorrect / quizTotalQuestions) * 100) : 0;
      const quizTotalXP = quizAllTimeScore * 10;

      const uniqueDates = Array.from(new Set(allHistory.map(h => {
        try {
          return new Date(h.completedAt).toLocaleDateString('en-CA');
        } catch (e) {
          return '';
        }
      }).filter(Boolean))).sort();

      let quizStreak = 0;
      let quizLongestStreak = 0;

      if (uniqueDates.length > 0) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        const hasToday = uniqueDates.includes(todayStr);
        const hasYesterday = uniqueDates.includes(yesterdayStr);

        if (hasToday || hasYesterday) {
          let currentRefDate = hasToday ? new Date() : yesterday;
          let active = true;
          while (active) {
            const checkStr = currentRefDate.toLocaleDateString('en-CA');
            if (uniqueDates.includes(checkStr)) {
              quizStreak++;
              currentRefDate.setDate(currentRefDate.getDate() - 1);
            } else {
              active = false;
            }
          }
        }

        let tempStreak = 0;
        let prevTime: number | null = null;
        uniqueDates.forEach(dStr => {
          const curTime = new Date(dStr).getTime();
          if (prevTime === null) {
            tempStreak = 1;
          } else {
            const diffDays = Math.round((curTime - prevTime) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              tempStreak++;
            } else if (diffDays > 1) {
              if (tempStreak > quizLongestStreak) {
                quizLongestStreak = tempStreak;
              }
              tempStreak = 1;
            }
          }
          prevTime = curTime;
        });
        if (tempStreak > quizLongestStreak) {
          quizLongestStreak = tempStreak;
        }
      }

      const currentHighestScore = allHistory.length > 0 
        ? Math.max(...allHistory.map(h => h.score || 0)) 
        : calculatedScore;

      const userStatsRef = doc(db, 'userStats', user.uid);
      const aggregatedStats = {
        quizAllTimeScore,
        quizTotalXP,
        quizTotalPlayed,
        quizTotalCorrect,
        quizTotalWrong,
        quizTotalSkipped,
        quizAccuracy,
        quizStreak,
        quizLongestStreak,
        quizLastScore: percentage,
        quizLastPlayDate: new Date().toLocaleDateString('en-CA'),
        quizLastPlayTime: serverTimestamp()
      };
      await setDoc(userStatsRef, aggregatedStats, { merge: true });

      const globalLeaderboardRef = doc(db, 'quiz_global_leaderboard', user.uid);
      const globalLeaderboardSnap = await getDoc(globalLeaderboardRef);

      const userLeaderboardPayload = {
        uid: user.uid,
        userId: user.uid,
        displayName: user.displayName || userData?.name || 'Devotee',
        userName: user.displayName || userData?.name || 'Devotee',
        photoURL: user.photoURL || userData?.profileImage || '',
        profileImage: user.photoURL || userData?.profileImage || '',
        overallScore: quizAllTimeScore,
        score: quizAllTimeScore,
        totalXP: quizTotalXP,
        xp: quizTotalXP,
        totalCorrect: quizTotalCorrect,
        correctAnswers: quizTotalCorrect,
        totalWrong: quizTotalWrong,
        wrongAnswers: quizTotalWrong,
        totalSkipped: quizTotalSkipped,
        skippedQuestions: quizTotalSkipped,
        totalQuizCompleted: quizTotalPlayed,
        totalQuizzes: quizTotalPlayed,
        overallAccuracy: quizAccuracy,
        accuracy: quizAccuracy,
        averageTime: quizTotalPlayed > 0 ? Math.round(totalTimeTaken / quizTotalPlayed) : 0,
        currentStreak: quizStreak,
        longestStreak: quizLongestStreak,
        highestScore: currentHighestScore,
        currentRank: 1,
        badge: '📿 Spiritual Seeker',
        badges: ['📿 Spiritual Seeker'],
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      if (globalLeaderboardSnap.exists()) {
        await setDoc(globalLeaderboardRef, userLeaderboardPayload, { merge: true });
      } else {
        await setDoc(globalLeaderboardRef, userLeaderboardPayload);
      }
      
      await setDoc(doc(db, 'quiz_leaderboard', user.uid), userLeaderboardPayload, { merge: true });

      try {
        const globalLeadSnap = await getDocs(collection(db, 'quiz_global_leaderboard'));
        const allLeadEntries: any[] = [];
        globalLeadSnap.forEach(d => {
          if (d.id !== user.uid) {
            allLeadEntries.push({ id: d.id, ...d.data() });
          }
        });
        allLeadEntries.push({ id: user.uid, ...userLeaderboardPayload });

        allLeadEntries.sort((a, b) => {
          const scoreA = a.overallScore || a.score || 0;
          const scoreB = b.overallScore || b.score || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          
          const accA = a.overallAccuracy || a.accuracy || 0;
          const accB = b.overallAccuracy || b.accuracy || 0;
          if (accB !== accA) return accB - accA;

          const xpA = a.totalXP || a.xp || 0;
          const xpB = b.totalXP || b.xp || 0;
          if (xpB !== xpA) return xpB - xpA;

          return (a.averageTime || 0) - (b.averageTime || 0);
        });

        const updatePromises = allLeadEntries.map(async (entry, index) => {
          const rank = index + 1;
          let badge = '📿 Spiritual Seeker';
          if (rank === 1) {
            badge = '👑 Spiritual Champion';
          } else if (rank === 2) {
            badge = '🥈 Divine Scholar';
          } else if (rank === 3) {
            badge = '🥉 Bhakti Master';
          } else if (rank <= 10) {
            badge = '⭐ Knowledge Star';
          }

          const updatedEntry = {
            ...entry,
            currentRank: rank,
            rank: rank,
            badge: badge,
            badges: [badge],
            updatedAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'quiz_global_leaderboard', entry.id), updatedEntry);
          await setDoc(doc(db, 'quiz_leaderboard', entry.id), updatedEntry);
        });

        await Promise.all(updatePromises);
      } catch (err) {
        console.error("Global leaderboard calculation error:", err);
      }

      fetch('/api/quiz/pre-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          subjectId: quiz.subjectId || 'ai_mixed'
        })
      }).catch(err => console.error("Background pre-generation failed:", err));

      if (percentage >= 60) {
        navigate(`/quiz/result/${sessionId}?cert=1`);
      } else {
        navigate(`/quiz/result/${sessionId}`);
      }

    } catch (error) {
      console.error("Evaluation/Submission failed:", error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#786D63] mt-4 font-bold font-sans">Preparing question papers...</p>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FFF7ED] border border-[#FF6B00]/20 flex items-center justify-center text-3xl animate-pulse">
          📖
        </div>
        <div className="space-y-2">
          <h3 className="font-sans font-black text-lg text-[#2E241B]">Aligning Divine Wisdom...</h3>
          <p className="text-xs text-[#786D63] max-w-sm mx-auto font-mukta leading-relaxed">
            The scriptural verses and spiritual exercises are currently synchronizing. Please wait while the wisdom structure is aligned for your study.
          </p>
        </div>
        <div className="flex justify-center gap-2 items-center text-xs text-[#FF6B00] font-bold">
          <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span>Receiving sacred teachings...</span>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isSelected = (option: string) => {
    const currentSel = selectedAnswers[currentQuestion.id];
    if (!currentSel) return false;
    if (Array.isArray(currentSel)) return currentSel.includes(option);
    return currentSel === option;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-24 font-sans select-none">
      
      {/* Play Navigation header */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EFE7DB]/60 py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 hover:bg-[#FFF7ED] text-[#2E241B] rounded-full transition"
          >
            <ArrowLeft size={18} className="text-[#FF6B00]" />
          </button>
          <span className="font-sans font-extrabold text-xs text-[#2E241B] max-w-[150px] md:max-w-xs truncate font-mukta">
            {quiz.name}
          </span>
        </div>

        {/* Floating countdown clock */}
        <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FF6B00]/10 px-4 py-2 rounded-2xl">
          <Clock size={14} className={timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-[#FF6B00]'} />
          <span className={`text-xs font-mono font-black ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-[#2E241B]'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-24 space-y-6">
        
        {/* Progress meters card */}
        <div className="bg-white rounded-[24px] border border-[#EFE7DB] p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-[#786D63]">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" /> 
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="font-black text-[#2E241B]">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-[#FFFDF8] border border-[#EFE7DB] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {overallChapterProgress && (
            <div className="pt-3 border-t border-[#EFE7DB]/60 flex items-center justify-between text-[11px] font-bold text-[#786D63] font-mukta">
              <span>Overall Chapter Progress:</span>
              <span className="text-[#FF6B00] font-black">{overallChapterProgress.count}/25 Questions ({overallChapterProgress.percent}%)</span>
            </div>
          )}
        </div>

        {/* ACTIVE QUESTION CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[28px] border border-[#EFE7DB] p-6 md:p-8 shadow-sm space-y-6"
          >
            {/* Header meta */}
            <div className="flex justify-between items-center">
              <span className="bg-[#FFF7ED] text-[#FF6B00] border border-[#FF6B00]/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                {currentQuestion.type === 'multiple_correct' ? 'Multiple Choice (Select All)' : 'Single Choice'}
              </span>

              <button
                onClick={handleToggleBookmark}
                className="p-2 bg-[#FFFDF8] border border-[#EFE7DB] rounded-xl hover:bg-[#FFF7ED] text-[#786D63] transition"
              >
                <Bookmark 
                  size={16} 
                  className={bookmarks.includes(currentQuestion.id) ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-[#786D63]'} 
                />
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-base md:text-lg font-black text-[#2E241B] leading-relaxed">
                {currentQuestion.text}
              </h2>

              {currentQuestion.scriptureRef && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FF6B00] bg-[#FFF7ED] px-2.5 py-1 rounded border border-[#FF6B00]/10 w-fit uppercase">
                  <Compass size={12} />
                  <span>{currentQuestion.scriptureRef}</span>
                </div>
              )}
            </div>

            {/* Answer Options list */}
            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const active = isSelected(option);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-4.5 rounded-2xl text-left text-xs md:text-sm font-bold transition duration-200 border flex items-center justify-between group active:scale-99 ${
                      active
                        ? 'bg-[#FFF7ED] border-[#FF6B00] text-[#FF6B00] shadow-sm'
                        : 'bg-white border-[#EFE7DB] text-[#2E241B] hover:border-[#FF6B00]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                        active 
                          ? 'bg-[#FF6B00] text-white border-transparent' 
                          : 'bg-[#FFFDF8] text-[#786D63] border-[#EFE7DB]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      active ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-[#EFE7DB]'
                    }`}>
                      {active && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM ACTION BUTTONS ROW */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`py-3.5 px-5 bg-white border border-[#EFE7DB] text-[#786D63] font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
              currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FFF7ED]'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => handleSubmitQuiz(false)}
              disabled={isSubmitting}
              className="py-3.5 px-8 bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20 active:scale-95 hover:brightness-105 transition"
            >
              <Award size={16} />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Answers'}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="py-3.5 px-6 bg-white border border-[#EFE7DB] text-[#FF6B00] font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FFF7ED] transition"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

      </main>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#EFE7DB] max-w-sm w-full p-6 text-center space-y-4 shadow-xl"
            >
              <AlertTriangle size={40} className="mx-auto text-[#FF6B00] animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-[#2E241B]">Quit Practice Session?</h4>
                <p className="text-xs text-[#786D63] leading-relaxed font-mukta">परीक्षा बीच में छोड़ने से प्रगति रुक जाएगी। क्या आप सचमुच बाहर निकलना चाहते हैं?</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="py-3 bg-neutral-100 hover:bg-neutral-200 text-[#786D63] font-bold rounded-xl text-xs"
                >
                  Stay & Play
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="py-3 bg-[#FF6B00] text-white font-extrabold rounded-xl text-xs hover:brightness-105"
                >
                  Quit Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
