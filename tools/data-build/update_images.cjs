const fs = require('fs');

const SHOW_IMAGES = {
  office: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/597/1494026.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/220/550710.jpg'
  },
  b99: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/402/1007484.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/13/34649.jpg'
  },
  community: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/407/1017835.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/223/557682.jpg'
  },
  friends: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/442/1106977.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/219/548045.jpg'
  },
  himym: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/43/109592.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/219/549159.jpg'
  },
  'modern-family': {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/359/898320.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/17/42843.jpg'
  },
  'parks-and-rec': {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/481/1204341.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/222/557127.jpg'
  },
  seinfeld: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/301/752548.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/219/549578.jpg'
  },
  tbbt: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/191/478714.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/4/12070.jpg'
  },
  iasip: {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/636/1592247.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/16/40956.jpg'
  },
  'rick-and-morty': {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/626/1566363.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/90/225679.jpg'
  },
  'new-girl': {
    cover: 'https://static.tvmaze.com/uploads/images/original_untouched/481/1202650.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/223/558386.jpg'
  }
};

let content = fs.readFileSync('src/data/sitcomsData.js', 'utf8');

// Replace show by show
for (const [id, imgs] of Object.entries(SHOW_IMAGES)) {
  // Regex finding the show block start: "id": "office", ... up to "imdbRating"
  // and replacing "coverImage": "..." and "backdropImage": "..."
  const regex = new RegExp(
    `("id":\\s*"${id}"[\\s\\S]*?"coverImage":\\s*")[^"]+("[\\s\\S]*?"backdropImage":\\s*")[^"]+(")`,
    'g'
  );
  
  if (!regex.test(content)) {
    console.error('Could not find regex match for show id:', id);
  } else {
    content = content.replace(regex, `$1${imgs.cover}$2${imgs.backdrop}$3`);
    console.log(`Updated images for ${id}`);
  }
}

fs.writeFileSync('src/data/sitcomsData.js', content, 'utf8');
console.log('Successfully updated src/data/sitcomsData.js');
