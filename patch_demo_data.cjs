const fs = require('fs');

const files = [
  'src/pages/home/HomeScreen.tsx',
  'src/pages/info/GalleryScreen.tsx',
  'src/pages/profile/NotificationsScreen.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove import
    content = content.replace(/import \{ DEMO_DATA \} from '.*?\/utils\/demoData';\n/g, '');
    
    // Replace fallback logic
    content = content.replace(/dbQuotes\.length > 0 \? dbQuotes : DEMO_DATA\.quotes/g, 'dbQuotes');
    content = content.replace(/quotes\.find\(\(q: any\) => q\.isDaily\) \|\| quotes\[0\] \|\| DEMO_DATA\.quotes\[0\]/g, 'quotes.find((q: any) => q.isDaily) || quotes[0]');
    content = content.replace(/quotes\.find\(\(q: any\) => !q\.isDaily\) \|\| DEMO_DATA\.quotes\[1\]/g, 'quotes.find((q: any) => !q.isDaily) || quotes[1]');
    content = content.replace(/dbVideos\.length > 0 \? dbVideos : DEMO_DATA\.videos/g, 'dbVideos');
    content = content.replace(/dbProducts\.length > 0 \? dbProducts : DEMO_DATA\.products/g, 'dbProducts');
    content = content.replace(/dbCategories\.length > 0 \? dbCategories : DEMO_DATA\.categories/g, 'dbCategories');
    content = content.replace(/autoPanchang \|\| DEMO_DATA\.panchang/g, 'autoPanchang');
    content = content.replace(/dbTestimonials\.length > 0 \? dbTestimonials : DEMO_DATA\.testimonials/g, 'dbTestimonials');
    content = content.replace(/dbEvents\.length > 0 \? dbEvents : DEMO_DATA\.events/g, 'dbEvents');
    content = content.replace(/dbFounder\.length > 0 \? dbFounder\[0\] : DEMO_DATA\.founder/g, 'dbFounder[0]');
    content = content.replace(/dbGallery\.length > 0 \? dbGallery : DEMO_DATA\.gallery/g, 'dbGallery');
    content = content.replace(/dbNotifications\.length > 0 \? dbNotifications : DEMO_DATA\.notifications/g, 'dbNotifications');

    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
});

