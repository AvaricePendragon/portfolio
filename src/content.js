export const ABOUT = {
  paragraphs: [
    "I build things for the web, and I get lost in the night sky when I should be sleeping.",
    "This site is a small universe. Every page is a different corner of it: a cluster of galaxies, a solar system, a few orbits, and a bend in spacetime.",
    "The scene behind this text is gravitational lensing. Light from a faraway galaxy gets bent by the gravity of a galaxy in front of it, so we see the same distant object in places it isn't. I like that idea: what you see depends on what stands in between.",
    "Hide this text with the eye button (or press H) and drag around to explore.",
  ],
  links: [
    { label: 'email', href: 'https://mail.google.com/mail/?view=cm&to=crescenttold@gmail.com' },
    { label: 'Instagram', href: 'https://instagram.com/crescenttells/' },
  ],
}

export const PROJECTS = {
  sub: 'some notable things i have built!',
  items: [
    {
      title: 'This Website',
      desc: 'Just my portfolio website.',
      tags: ['react native', 'firebase'],
      link: '',
      // gambar biasa
      media: { type: 'image', src: '/media/webset.png' },
    },
  ],
}

export const WRITING = {
  sub: 'notes, thoughts, and things i learned along the way.',
  items: [
    {
      slug: 'Hypocrisy-on-its-peak',
      title: 'Hypocrisy on its peak',
      date: 'July 15, 2026',
      body: [
        "a.",
        "a.",
        "a.",
        { type: 'image', src: '/media/cabinet/', caption: 'computer network' },

      ],
    },

    {
      slug: 'sometimes-lifes-a-mess',
      title: 'Sometimes Lifes a mess',
      date: 'May 2, 2026',
      body: [
        "I belong with the one put on this Earth for me, Everybody has their someone, just gotta look and see.",
        "I'm screaming out, Lord, help me, I've been lonely That's when you accept me, then you set me free.",
        "sometimes life's a mess, I get high when I'm upset, I remember when me and love didn't click, Searching for somethin' real then I found it.",
        { type: 'image', src: '/media/cabinet/', caption: 'computer network' },

      ],
    },
  ],
}

export const CABINET = {
  sub: 'things id like to listen. tap a song to play a snippet!!',
  items: [
    // kind: 'song' → sampul + potongan lagu otomatis dari iTunes (tulis "judul artis")
    // kind: 'film' → poster dari iTunes; link = halaman yang dibuka saat diklik
    { kind: 'song', title: 'Lifes A Mess', by: 'Juice WRLD, Halsey', itunes: 'Lifes A Mess JuiceWRLD' },
    { kind: 'song', title: 'Please Dont Call', by: 'Bleachers', itunes: 'Please Dont Call Bleachers' },
    {
      kind: 'film',
      title: 'Lord Of The Mysteries',
      by: 'Cuttlefish That Loves Diving',
      cover: '/public/media/cabinet/lotm.webp',
      link: 'https://en.wikipedia.org/wiki/Captain_America:_The_Winter_Soldier',
    },
    { kind: 'song', title: '505', by: 'Arctic Monkeys', itunes: '505 Arctic Monkeys' },
    { kind: 'song', title: 'Line Without A Hook', by: 'Ricky Montgomery', itunes: 'Line Without A Hook' },
    { kind: 'song', title: 'Back To Me', by: 'The Marias', itunes: 'Back To Me The Marias' },
    { kind: 'song', title: 'Amour Plastique', by: 'Adèle Castillon & Matthieu Reynaud', itunes: 'Amour Plastique Adèle Castillon & Matthieu Reynaud' },
    {
      kind: 'film',
      title: 'Dune',
      by: 'Frank Herbert',
      cover: '/media/cabinet/dune.webp',
      link: 'https://en.wikipedia.org/wiki/Project_Hail_Mary_(film)',
    },
    {
      kind: 'film',
      title: 'Interstellar',
      by: 'Christopher Nolan',
      cover: '/media/cabinet/Interstellar_film_poster.webp',
      link: 'https://en.wikipedia.org/wiki/Interstellar_(film)',

    },
    {
      kind: 'film',
      title: 'Your Name',
      by: 'Makoto Shinkai',
      cover: '/media/cabinet/Your_Name_poster.webp',
      link: 'https://en.wikipedia.org/wiki/Your_Name'
    },
    { kind: 'song', title: 'LOVE DIVE', by: 'IVE', itunes: 'LOVE DIVE IVE' },
    { kind: 'song', title: 'Duvet', by: 'Boa', itunes: 'Duvet Boa' },
    { kind: 'song', title: 'the less i know the better', by: 'Tame Impala', itunes: 'the less i know the better Tame Impala' },
    { kind: 'song', title: 'Falling', by: 'Kevin Kasani', itunes: 'Falling Kevin Kasani' },
    { kind: 'song', title: 'Harvey', by: 'Her\'s', itunes: 'Harvey Her\'s' },
    {
      kind: 'film',
      title: 'Tenet',
      by: 'blom disi',
      cover: '/media/cabinet/tenet.webp',
      link: 'https://en.wikipedia.org/wiki/The_Last:_Naruto_the_Movie',
    },
    {
      kind: 'film',
      title: 'Look Back',
      by: 'Tatsuki Fujimoto',
      cover: '/media/cabinet/Look_Back.webp',
      link: 'https://id.wikipedia.org/wiki/Look_Back_(film_2024)',
    },
    {
      kind: 'film',
      title: 'The Odyssey',
      by: 'Christopher Nolan',
      cover: '/media/cabinet/The_Odyssey-film_poster.webp',
      link: 'https://id.wikipedia.org/wiki/The_Odyssey_(film_2026)',
    },
    { kind: 'song', title: 'Telepatia', by: 'Kali Uchis', itunes: 'Telepatia Kali Uchis' },
  ],
}