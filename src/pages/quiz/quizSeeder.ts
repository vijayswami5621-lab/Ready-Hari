import { collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Subject, Quiz, Question } from './types';

export const seedQuizDatabase = async (force = false) => {
  try {
    const subjectsSnap = await getDocs(collection(db, 'quiz_subjects'));
    if (!subjectsSnap.empty && !force) {
      console.log('Quiz database is already seeded.');
      return;
    }

    console.log('Seeding spiritual quiz database...');
    const batch = writeBatch(db);

    // 1. Create Subjects
    const subjects: Subject[] = [
      {
        id: 'bhagavad_gita',
        name: 'Bhagavad Gita (श्रीमद्भगवद्गीता)',
        description: 'अर्जुन और भगवान श्रीकृष्ण के मध्य कुरुक्षेत्र में हुआ पावन संवाद, जो जीवन जीने की कला सिखाता है।',
        coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 18,
        questionsCount: 450,
        difficulty: 'Intermediate',
        estimatedTime: '15 mins/chapter',
        createdAt: serverTimestamp()
      },
      {
        id: 'hanuman_chalisa',
        name: 'Hanuman Chalisa (हनुमान चालीसा)',
        description: 'महाकवि तुलसीदास जी द्वारा रचित, पवनपुत्र हनुमान जी की असीम शक्ति और भक्ति का पावन गान।',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'ramcharitmanas',
        name: 'Ramcharitmanas (श्रीरामचरितमानस)',
        description: 'गोस्वामी तुलसीदास जी द्वारा रचित अवधी रामायण, जो मर्यादा पुरुषोत्तम श्रीराम के आदर्श चरित्र को दर्शाती है।',
        coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 7,
        questionsCount: 175,
        difficulty: 'Advanced',
        estimatedTime: '12 mins/kand',
        createdAt: serverTimestamp()
      },
      {
        id: 'ramayana',
        name: 'Valmiki Ramayana (वाल्मीकि रामायण)',
        description: 'आदिकवि वाल्मीकि द्वारा संस्कृत महाकाव्य में रचित मर्यादा पुरुषोत्तम श्रीराम की मूल गाथा।',
        coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 7,
        questionsCount: 175,
        difficulty: 'Advanced',
        estimatedTime: '12 mins/kand',
        createdAt: serverTimestamp()
      },
      {
        id: 'mahabharata',
        name: 'Mahabharata (महाभारत)',
        description: 'महर्षि वेदव्यास जी द्वारा रचित धर्म और अधर्म के बीच कुरुक्षेत्र के महान युद्ध की अमर गाथा।',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 6,
        questionsCount: 150,
        difficulty: 'Advanced',
        estimatedTime: '15 mins/parva',
        createdAt: serverTimestamp()
      },
      {
        id: 'shiv_puran',
        name: 'Shiva Purana (शिव पुराण)',
        description: 'भगवान शिव के अवतारों, ज्योतिर्लिंगों, शक्ति उपासना और ध्यान सूत्रों का सर्वोत्कृष्ट ग्रंथ।',
        coverImage: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 4,
        questionsCount: 100,
        difficulty: 'Intermediate',
        estimatedTime: '12 mins/samhita',
        createdAt: serverTimestamp()
      },
      {
        id: 'vishnu_puran',
        name: 'Vishnu Purana (विष्णु पुराण)',
        description: 'भगवान विष्णु के दशावतार, सृष्टि रचना, और भक्त ध्रुव-प्रह्लाद की भक्ति का पवित्र ग्रंथ।',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 5,
        questionsCount: 125,
        difficulty: 'Intermediate',
        estimatedTime: '12 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'bhagavatam',
        name: 'Srimad Bhagavatam (श्रीमद्भागवत महापुराण)',
        description: 'परम हंसों की संहिता, जिसमें भक्ति योग, ज्ञान, वैराग्य और श्रीकृष्ण की दिव्य लीलाओं का रस है।',
        coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 6,
        questionsCount: 150,
        difficulty: 'Advanced',
        estimatedTime: '15 mins/canto',
        createdAt: serverTimestamp()
      },
      {
        id: 'vedas',
        name: 'Four Vedas (चार वेद)',
        description: 'सनातन धर्म के परम प्रमाण अपौरुषेय वेद - ऋग्वेद, यजुर्वेद, सामवेद और अथर्ववेद का परिचय।',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 4,
        questionsCount: 100,
        difficulty: 'Advanced',
        estimatedTime: '15 mins/veda',
        createdAt: serverTimestamp()
      },
      {
        id: 'upanishads',
        name: 'Upanishads (उपनिषद ज्ञान)',
        description: 'वेदांत के परम गोपनीय ज्ञान का महासागर - ईश, कठ, मुण्डक और छान्दोग्य उपनिषद।',
        coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 4,
        questionsCount: 100,
        difficulty: 'Advanced',
        estimatedTime: '15 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'sunderkand',
        name: 'Sunderkand (सुन्दरकाण्ड)',
        description: 'हनुमान जी के लंका प्रस्थान, सीता माता की खोज, और लंका दहन की परम पावन मंगलकारी गाथा।',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 3,
        questionsCount: 75,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'durga_saptashati',
        name: 'Durga Saptashati (दुर्गा सप्तशती)',
        description: 'देवी माहात्म्य, महिषासुर मर्दिनी और माँ आदिशक्ति के परम पावन चरित्रों की गाथा।',
        coverImage: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 3,
        questionsCount: 75,
        difficulty: 'Intermediate',
        estimatedTime: '12 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'saints',
        name: 'Saints & Gurus (महान संत और गुरु)',
        description: 'आदि शंकराचार्य, कबीर, तुलसीदास से विवेकानंद तक भारत के महान संतों का जीवन चरित्र।',
        coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 3,
        questionsCount: 75,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/era',
        createdAt: serverTimestamp()
      },
      {
        id: 'temples',
        name: 'Sacred Temples & Pilgrimages (तीर्थ और मंदिर)',
        description: 'द्वादश ज्योतिर्लिंग, चार धाम और भारत के प्राचीन वैज्ञानिक मंदिरों का पावन इतिहास।',
        coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 3,
        questionsCount: 75,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'indian_culture',
        name: 'Indian Culture & Values (भारतीय संस्कृति और मूल्य)',
        description: 'चार पुरुषार्थ, वर्णाश्रम, षोडश संस्कार और सनातन जीवन शैली का वैज्ञानिक आधार।',
        coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'festivals',
        name: 'Festivals & Vrats (उत्सव और व्रत विज्ञान)',
        description: 'दीपावली, होली, नवरात्रि से महाशिवरात्रि तक सभी त्योहारों का खगोलीय और आध्यात्मिक महत्व।',
        coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'yoga',
        name: 'Yoga Science (योग विज्ञान)',
        description: 'महर्षि पतंजलि का अष्टांग योग, यम-नियम, प्राणायाम और चित्त शुद्धि के अनुपम सूत्र।',
        coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Intermediate',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'meditation',
        name: 'Meditation & Dhyana (ध्यान साधना)',
        description: 'साक्षी भाव, चक्र ध्यान, मंत्र जप और कुंडलिनी योग की गहराइयों का आध्यात्मिक दर्शन।',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Intermediate',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'sanskrit',
        name: 'Sanskrit & Shlokas (संस्कृत भाषा और श्लोक)',
        description: 'देवभाषा संस्कृत का व्याकरण, पाणिनि सूत्र और महाकाव्यों के प्रसिद्ध श्लोकों का अर्थ।',
        coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Intermediate',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      },
      {
        id: 'general_spiritual_knowledge',
        name: 'General Spiritual Knowledge (सामान्य आध्यात्मिक ज्ञान)',
        description: 'सनातन धर्म, त्रिदेव संकल्पना, कर्म सिद्धांत और दैनिक हिंदू आचरण का सहज ज्ञान।',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
        quizzesCount: 2,
        questionsCount: 50,
        difficulty: 'Beginner',
        estimatedTime: '10 mins/part',
        createdAt: serverTimestamp()
      }
    ];

    subjects.forEach((subj) => {
      const ref = doc(db, 'quiz_subjects', subj.id);
      batch.set(ref, subj);
    });

    // 2. Create Quizzes
    const quizzes: Quiz[] = [
      {
        id: 'gita_core_knowledge',
        subjectId: 'bhagavad_gita',
        name: 'Gita Chapter 2 Wisdom (गीता द्वितीय अध्याय ज्ञान)',
        description: 'सांख्य योग, आत्मा की अमरता और स्थिरप्रज्ञ पुरुष के दिव्य लक्षणों पर आधारित पावन प्रश्नोत्तरी।',
        coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80',
        type: 'timed',
        timeLimit: 120, // 2 mins
        questionsCount: 4,
        points: 40,
        isPublished: true,
        isTodayQuiz: true,
        createdAt: serverTimestamp()
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
        isTodayQuiz: false,
        createdAt: serverTimestamp()
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
        isTodayQuiz: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'ram_bal_kand',
        subjectId: 'ramcharitmanas',
        name: 'Bala Kanda Leela (बालकाण्ड और राम जन्म)',
        description: 'प्रभु श्रीराम के प्राकट्य, बाल स्वरूप, विश्वामित्र यज्ञ रक्षा और सीता स्वयंवर प्रसंग की अद्भुत लीला।',
        coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80',
        type: 'chapter',
        timeLimit: 150,
        questionsCount: 4,
        points: 40,
        isPublished: true,
        isTodayQuiz: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'hindu_festivals_intro',
        subjectId: 'hindu_dharma',
        name: 'Sanatan Festivals and Calendar (त्योहारों का वैज्ञानिक महत्व)',
        description: 'होली, दीवाली, महाशिवरात्रि जैसे पावन उत्सवों और हिन्दू पंचांग का मौलिक परिचय।',
        coverImage: 'https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80',
        type: 'mixed',
        timeLimit: 90,
        questionsCount: 4,
        points: 40,
        isPublished: true,
        isTodayQuiz: false,
        createdAt: serverTimestamp()
      }
    ];

    quizzes.forEach((quiz) => {
      const ref = doc(db, 'quiz_quizzes', quiz.id);
      batch.set(ref, quiz);
    });

    // 3. Create Questions
    const questions: Question[] = [
      // Gita Chapter 2 Questions
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

      // Gita Chapter 12 Questions (भक्ति योग)
      {
        id: 'q_gita_b1',
        quizId: 'gita_avatar_intro',
        subjectId: 'bhagavad_gita',
        text: 'गीता के किस अध्याय को "भक्ति योग" (Bhakti Yoga) कहा जाता है?',
        type: 'mcq',
        options: ['अध्याय 12', 'अध्याय 18', 'अध्याय 4', 'अध्याय 15'],
        correctAnswer: 'अध्याय 12',
        explanation: 'श्रीमद्भगवद्गीता के 12वें अध्याय का नाम भक्ति योग है, जिसमें भगवान ने भक्त के श्रेष्ठ गुणों की व्याख्या की है।',
        scriptureRef: 'Bhagavad Gita',
        chapter: '12',
        verse: '1-20'
      },
      {
        id: 'q_gita_b2',
        quizId: 'gita_avatar_intro',
        subjectId: 'bhagavad_gita',
        text: 'भगवान के साकार रूप और निराकार रूप में से किसे उपासना के लिए सुलभ बताया गया है?',
        type: 'mcq',
        options: [
          'साकार रूप (Sakar Form)',
          'निराकार रूप (Nirakar Form)',
          'दोनों ही अत्यंत कठिन हैं',
          'दोनों ही समान रूप से बहुत सुलभ हैं'
        ],
        correctAnswer: 'साकार रूप (Sakar Form)',
        explanation: 'देहाभिमानियों के लिए निराकार ब्रह्म का चिंतन अत्यंत क्लेशदायक और कठिन है, अतः सगुण-साकार भगवान की पूजा सुगम और श्रेष्ठ मानी गई है।',
        scriptureRef: 'Bhagavad Gita',
        chapter: '12',
        verse: '5'
      },
      {
        id: 'q_gita_b3',
        quizId: 'gita_avatar_intro',
        subjectId: 'bhagavad_gita',
        text: 'भगवान श्रीकृष्ण का कुरुक्षेत्र युद्ध में सारथी बनना किस भक्ति भाव को प्रकट करता है?',
        type: 'mcq',
        options: [
          'दास्य और सख्य भाव के प्रति भगवान का अगाध स्नेह',
          'भगवान की विवशता',
          'केवल एक सामान्य कर्तव्य',
          'कोई आध्यात्मिक रहस्य नहीं'
        ],
        correctAnswer: 'दास्य और सख्य भाव के प्रति भगवान का अगाध स्नेह',
        explanation: 'परमेश्वर होकर भी भक्त अर्जुन के लिए सारथी (रथ हांकने वाला) बनना प्रभु की भक्तवत्सलता और सख्य प्रेम का सर्वोत्तम उदाहरण है।',
        scriptureRef: 'Bhagavad Gita',
        chapter: '11',
        verse: '44'
      },

      // Hanuman Chalisa Questions
      {
        id: 'q_hc_1',
        quizId: 'hanuman_chalisa_basic',
        subjectId: 'hanuman_chalisa',
        text: 'प्रसिद्ध हनुमान चालीसा की रचना किनके द्वारा की गई थी?',
        type: 'mcq',
        options: ['गोस्वामी तुलसीदास जी', 'संत कबीरदास जी', 'वेदव्यास जी', 'वाल्मीकि जी'],
        correctAnswer: 'गोस्वामी तुलसीदास जी',
        explanation: 'हनुमान चालीसा की रचना महान भक्त और कवि गोस्वामी तुलसीदास जी द्वारा 16वीं शताब्दी में की गई थी।',
        scriptureRef: 'Ramcharitmanas Mandिर',
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
      },
      {
        id: 'q_hc_3',
        quizId: 'hanuman_chalisa_basic',
        subjectId: 'hanuman_chalisa',
        text: 'हनुमान चालीसा के अनुसार, लक्ष्मण जी के प्राण बचाने के लिए संजीवनी बूटी लाते समय हनुमान जी ने किसे परास्त किया था?',
        type: 'mcq',
        options: ['कालनेमी और भरत जी का भ्रम निवारण किया', 'मेघनाद', 'कुम्भकर्ण', 'अहिरावण'],
        correctAnswer: 'कालनेमी और भरत जी का भ्रम निवारण किया',
        explanation: 'रास्ते में रावण द्वारा भेजे गए कालनेमी राक्षस का वध किया और लौटते समय अयोध्या के ऊपर भरत जी के बाण से नीचे उतरकर उनका भ्रम दूर किया।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'लंकाकाण्ड',
        verse: '54'
      },
      {
        id: 'q_hc_4',
        quizId: 'hanuman_chalisa_basic',
        subjectId: 'hanuman_chalisa',
        text: '"जुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥" इस चौपाई में किस वैज्ञानिक दूरी का संकेत मिलता है?',
        type: 'mcq',
        options: [
          'सूर्य और पृथ्वी के बीच की खगोलीय दूरी',
          'चन्द्रमा और पृथ्वी की दूरी',
          'समुद्र की गहराई',
          'अयोध्या और लंका के बीच की दूरी'
        ],
        correctAnswer: 'सूर्य और पृथ्वी के बीच की खगोलीय दूरी',
        explanation: '1 जुग (युग) = 12,000 वर्ष, 1 सहस्र = 1000, 1 जोजन (योजन) = 8 मील। इनका गुणा करने पर पृथ्वी और सूर्य के बीच की वास्तविक दूरी लगभग 9 करोड़ 60 लाख मील प्राप्त होती है।',
        scriptureRef: 'Hanuman Chalisa',
        chapter: 'चौपाई',
        verse: '18'
      },

      // Ramcharitmanas Questions
      {
        id: 'q_rc_1',
        quizId: 'ram_bal_kand',
        subjectId: 'ramcharitmanas',
        text: 'श्रीरामचरितमानस ग्रंथ किस भाषा में लिखा गया है?',
        type: 'mcq',
        options: ['अवधी भाषा (Awadhi)', 'सस्कृत भाषा (Sanskrit)', 'ब्रजभाषा (Brajbhasha)', 'प्राकृत भाषा (Prakrit)'],
        correctAnswer: 'अवधी भाषा (Awadhi)',
        explanation: 'गोस्वामी तुलसीदास जी ने श्रीरामचरितमानस की रचना जनसाधारण की भाषा अवधी में की, ताकि प्रभु श्रीराम की कथा जन-जन तक सरल रूप में पहुँच सके।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'बालकाण्ड',
        verse: 'मंगलाचरण'
      },
      {
        id: 'q_rc_2',
        quizId: 'ram_bal_kand',
        subjectId: 'ramcharitmanas',
        text: 'श्रीरामचरितमानस में कुल कितने काण्ड (Chapters/Books) हैं?',
        type: 'mcq',
        options: ['7 काण्ड', '9 काण्ड', '5 काण्ड', '12 काण्ड'],
        correctAnswer: '7 काण्ड',
        explanation: 'श्रीरामचरितमानस में सात सोपान (काण्ड) हैं: बालकाण्ड, अयोध्याकाण्ड, अरण्यकाण्ड, किष्किन्धाकाण्ड, सुन्दरकाण्ड, लंकाकाण्ड और उत्तरकाण्ड।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'संरचना',
        verse: 'सात काण्ड'
      },
      {
        id: 'q_rc_3',
        quizId: 'ram_bal_kand',
        subjectId: 'ramcharitmanas',
        text: 'जनकपुर में सीता स्वयंवर के समय श्रीराम जी ने शिवजी के किस पावन धनुष को तोड़ा था?',
        type: 'mcq',
        options: ['पिनाक धनुष (Pinaka)', 'गांडीव धनुष (Gandiva)', 'शार्ंग धनुष (Sharnga)', 'कौमोदकी धनुष'],
        correctAnswer: 'पिनाक धनुष (Pinaka)',
        explanation: 'भगवान शिव के पिनाक नामक महाधनुष को श्रीराम ने गुरु विश्वामित्र की आज्ञा पाकर सहज ही उठा लिया और प्रत्यंचा चढ़ाते समय वह टूट गया।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'बालकाण्ड',
        verse: 'सीता स्वयंवर'
      },
      {
        id: 'q_rc_4',
        quizId: 'ram_bal_kand',
        subjectId: 'ramcharitmanas',
        text: 'राम जन्म के समय अयोध्या में किस ऋतु जैसा सुहावना वातावरण हो गया था?',
        type: 'mcq',
        options: [
          'शीतल, मंद और सुगंधित पवन के साथ वसंत ऋतु जैसा',
          'अत्यंत भीषण ग्रीष्म ऋतु',
          'प्रलयंकारी वर्षा ऋतु',
          'घोर शरद ऋतु'
        ],
        correctAnswer: 'शीतल, मंद और सुगंधित पवन के साथ वसंत ऋतु जैसा',
        explanation: '"पुनि प्रगटे सुरपति मन हरषा। बरषि सुमन दुंदुभी बजाई।" भगवान के प्रकट होते ही दिशाएं निर्मल हो गईं और शीतल-मंद-सुगंधित हवा बहने लगी।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'बालकाण्ड',
        verse: '190'
      },

      // Hindu Festivals Questions
      {
        id: 'q_hf_1',
        quizId: 'hindu_festivals_intro',
        subjectId: 'hindu_dharma',
        text: 'सनातन पंचांग के अनुसार, नववर्ष (New Year) किस माह के शुक्ल पक्ष की प्रतिपदा से प्रारम्भ होता है?',
        type: 'mcq',
        options: ['चैत्र मास (Chaitra)', 'वैशाख मास (Vaisakha)', 'कार्तिक मास (Kartik)', 'श्रावण मास (Shravan)'],
        correctAnswer: 'चैत्र मास (Chaitra)',
        explanation: 'चैत्र शुक्ल प्रतिपदा को हिन्दू नव संवत्सर (नववर्ष) आरम्भ होता है। इसी पावन दिन ब्रह्मा जी ने सृष्टि की रचना की थी।',
        scriptureRef: 'Brahma Purana',
        chapter: 'सृष्टि काल',
        verse: '1'
      },
      {
        id: 'q_hf_2',
        quizId: 'hindu_festivals_intro',
        subjectId: 'hindu_dharma',
        text: 'दीपावली का त्योहार कार्तिक अमावस्या को किस पावन स्मृति में मनाया जाता है?',
        type: 'mcq',
        options: [
          'श्रीराम के 14 वर्ष के वनवास के पश्चात अयोध्या लौटने पर',
          'भगवान शिव के विवाह उत्सव पर',
          'भीष्म पितामह के प्राण त्यागने पर',
          'समुद्र मंथन प्रारम्भ होने पर'
        ],
        correctAnswer: 'श्रीराम के 14 वर्ष के वनवास के पश्चात अयोध्या लौटने पर',
        explanation: 'मर्यादा पुरुषोत्तम श्रीराम जब रावण वध करके सीता जी और लक्ष्मण जी के साथ अयोध्या लौटे, तो अयोध्यावासियों ने घी के दीये जलाकर उनका भव्य स्वागत किया था।',
        scriptureRef: 'Ramcharitmanas',
        chapter: 'उत्तरकाण्ड',
        verse: 'राज्याभिषेक'
      },
      {
        id: 'q_hf_3',
        quizId: 'hindu_festivals_intro',
        subjectId: 'hindu_dharma',
        text: 'होली का पावन त्योहार किस भक्त के प्राण रक्षा की स्मृति और बुराई पर अच्छाई की विजय के रूप में मनाया जाता है?',
        type: 'mcq',
        options: ['भक्त प्रहलाद', 'भक्त ध्रुव', 'भक्त विभीषण', 'भक्त हनुमान'],
        correctAnswer: 'भक्त प्रहलाद',
        explanation: 'हिरण्यकश्यप की बहन होलिका प्रहलाद को अग्नि में जलाने बैठी थी। भगवान नारायण की कृपा से होलिका जल गई और परम भक्त प्रहलाद सकुशल बच गए।',
        scriptureRef: 'Vishnu Purana',
        chapter: 'भक्त चरित्र',
        verse: 'प्रहलाद प्रसंग'
      },
      {
        id: 'q_hf_4',
        quizId: 'hindu_festivals_intro',
        subjectId: 'hindu_dharma',
        text: 'महाशिवरात्रि का त्योहार भगवान शिव के संदर्भ में किस प्रमुख घटना की याद दिलाता है?',
        type: 'mcq',
        options: [
          'भगवान शिव और माता पार्वती का परम पावन विवाह उत्सव',
          'शिवजी द्वारा कामदेव का भस्म होना',
          'शिवजी का कैलाश पर प्रथम आगमन',
          'गंगा का पृथ्वी पर अवतरण'
        ],
        correctAnswer: 'भगवान शिव और माता पार्वती का परम पावन विवाह उत्सव',
        explanation: 'महाशिवरात्रि वह परम कल्याणकारी तिथि है जब निराकार शिव सगुण-साकार शिव बने थे और जगत माता पार्वती के साथ परिणय सूत्र में बंधे थे।',
        scriptureRef: 'Shiva Purana',
        chapter: 'रुद्रसंहिता',
        verse: 'शिव विवाह'
      }
    ];

    questions.forEach((q) => {
      const ref = doc(db, 'quiz_questions', q.id);
      batch.set(ref, q);
    });

    await batch.commit();
    console.log('Quiz database seeded successfully with 4 subjects, 5 quizzes, and 19 questions!');
  } catch (error) {
    console.error('Error seeding quiz database:', error);
  }
};
