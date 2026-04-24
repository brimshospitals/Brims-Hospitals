// Bihar: 38 Districts → 534 Prakhands (Blocks)
const biharDistricts: Record<string, string[]> = {
  Araria: [
    "Araria", "Bhargama", "Forbesganj", "Jokihat", "Kursakanta",
    "Narpatganj", "Palasi", "Raniganj", "Sikti",
  ],
  Arwal: [
    "Arwal", "Karpi", "Kaler", "Kurtha", "Sonbhadra Banshi Suryapur",
  ],
  Aurangabad: [
    "Aurangabad", "Barun", "Daudnagar", "Dev", "Goh",
    "Haspura", "Kutumba", "Madanpur", "Nabinagar", "Obra", "Rafiganj",
  ],
  Banka: [
    "Amarpur", "Barahat", "Banka", "Belhar", "Bounsi",
    "Chanan", "Dhuraiya", "Fullidumar", "Katoria", "Rajoun", "Shambhuganj",
  ],
  Begusarai: [
    "Bachhwara", "Bakhri", "Balia", "Barauni", "Begusarai",
    "Bhagwanpur", "Birpur", "Cheriya Bariarpur", "Chhaurahi", "Dandari",
    "Garhpura", "Khudabandpur", "Mansurchak", "Matihani", "Nawkothi",
    "Sahebpur Kamal", "Samho At Saur", "Teghra",
  ],
  Bhagalpur: [
    "Bhagalpur", "Bihpur", "Goradih", "Ismailpur", "Jagdishpur",
    "Kahalgaon", "Kharik", "Khirhar", "Narayanpur", "Nathnagar",
    "Naugachhia", "Pirpainti", "Sabour", "Sanhaula", "Shahkund", "Sultanganj",
  ],
  Bhojpur: [
    "Agiaon", "Arrah", "Barhara", "Behea", "Charpokhari",
    "Garhani", "Jagdishpur", "Koilwar", "Piro", "Sahar",
    "Sandesh", "Shahpur", "Tarari", "Udwantnagar",
  ],
  Buxar: [
    "Brahmpur", "Buxar", "Chausa", "Chougain", "Dumraon",
    "Itarhi", "Kesath", "Nawanagar", "Rajpur", "Sadar", "Simri",
  ],
  Darbhanga: [
    "Alinagar", "Baheri", "Bahadurpur", "Benipur", "Biraul",
    "Darbhanga Sadar", "Ghanshyampur", "Gaura Bauram", "Hanuman Nagar", "Hayaghat",
    "Jale", "Keoti", "Kiratpur", "Kusheshwar Asthan", "Kusheshwar Asthan East",
    "Manigachhi", "Singhwara", "Tardih",
  ],
  "East Champaran": [
    "Adapur", "Areraj", "Banjariya", "Chakia", "Chiraia",
    "Dhaka", "Ghorasahan", "Govindganj", "Harsidhi", "Kalyanpur",
    "Kesaria", "Kotwa", "Madhuban", "Mehsi", "Mithanpura",
    "Pakridayal", "Paharpur", "Patahi", "Phenhara", "Pipra",
    "Ramgarhwa", "Raxaul", "Sangrampur", "Sugauli", "Tetaria",
    "Turkaulia", "Yadapur",
  ],
  Gaya: [
    "Amas", "Atri", "Bankebazar", "Barachatti", "Belaganj",
    "Bodh Gaya", "Dobhi", "Dumaria", "Fatehpur", "Guraru",
    "Gurua", "Gaya Sadar", "Imamganj", "Khizarsarai", "Konch",
    "Manpur", "Mohanpur", "Muhra", "Paraiya", "Sherghati",
    "Tankuppa", "Tekari", "Tikari", "Wazirganj",
  ],
  Gopalganj: [
    "Baikunthpur", "Barauli", "Bhorey", "Gopalganj", "Hathua",
    "Kataiya", "Kuchaikote", "Manjha", "Panchdeori", "Phulwaria",
    "Sidhwalia", "Thawe", "Uchkagaon", "Vijaypur",
  ],
  Jamui: [
    "Barhat", "Chakai", "Gidhaur", "Islamnagar", "Jamui",
    "Jhajha", "Khairhat", "Lakshmipur", "Sikandra", "Sono",
  ],
  Jehanabad: [
    "Ghoshi", "Hulasganj", "Jehanabad", "Kako", "Makhdumpur",
    "Modanganj", "Ratni Faridpur",
  ],
  "Kaimur (Bhabua)": [
    "Adhaura", "Bhagwanpur", "Bhabua", "Chainpur", "Chand",
    "Durgawati", "Kudra", "Mohania", "Nuaon", "Ramgarh", "Rampur",
  ],
  Katihar: [
    "Amdabad", "Azamnagar", "Balrampur", "Barari", "Barsoi",
    "Dandkhora", "Falka", "Kadwa", "Katihar", "Korha",
    "Kursela", "Manihari", "Mansahi", "Pranpur", "Sameli", "Sonbarsa",
  ],
  Khagaria: [
    "Alauli", "Chautham", "Gogri", "Khagaria", "Mancahpur", "Mansi", "Parbalpur",
  ],
  Kishanganj: [
    "Bahadurganj", "Dighalbank", "Kishanganj", "Kochadhaman",
    "Pothia", "Terhagachh", "Thakurganj",
  ],
  Lakhisarai: [
    "Chandaur", "Halsi", "Lakhisarai", "Pipariya", "Ramgarh Chowk", "Suryagarha",
  ],
  Madhepura: [
    "Alamnagar", "Bihariganj", "Chausa", "Gamharia", "Ghailarh",
    "Gwalpara", "Kumarkhand", "Madhepura", "Murliganj", "Puraini",
    "Shankarpur", "Singheshwar", "Udakishanganj",
  ],
  Madhubani: [
    "Andharatharhi", "Babubarhi", "Basopatti", "Benipatti", "Bisfi",
    "Ghoghardiha", "Harlakhi", "Jaynagar", "Jhanjharpur", "Khajauli",
    "Khutauna", "Ladania", "Laukaha", "Laukahi", "Madhubani",
    "Madhepur", "Pandaul", "Phulparas", "Rahika", "Rajnagar", "Satour",
  ],
  Munger: [
    "Asarganj", "Bariyarpur", "Dharhara", "Haveli Kharagpur", "Jamalpur",
    "Mufassil", "Munger", "Tarapur", "Teghra",
  ],
  Muzaffarpur: [
    "Aurai", "Bochahan", "Gaighat", "Kanti", "Katra",
    "Kurhani", "Marwan", "Minapur", "Motipur", "Muzaffarpur Sadar",
    "Paroo", "Parihar", "Sahebganj", "Sakra", "Saugo", "Turki",
  ],
  Nalanda: [
    "Asthawan", "Ben", "Bihar Sharif", "Bind", "Chandi",
    "Ekangarsarai", "Giriyak", "Harnaut", "Hilsa", "Islampur",
    "Karaiparsurai", "Katrisarai", "Noorsarai", "Parbalpur", "Rahui",
    "Rajgir", "Rewanand", "Silao", "Sirdala", "Tharthari",
  ],
  Nawada: [
    "Akbarpur", "Gobindpur", "Hisua", "Kashi Chak", "Kawakol",
    "Meskaur", "Nardiganj", "Narhat", "Nawada", "Pakribarawan",
    "Rajauli", "Roh", "Sirdala", "Warsaliganj",
  ],
  Patna: [
    "Athmalgola", "Bakhtiyarpur", "Barh", "Belchi", "Bihta",
    "Bikram", "Danapur", "Dhanaruwa", "Dulhin Bazar", "Fatuha",
    "Ghoswari", "Khusrupur", "Maner", "Manaru", "Masaurhi",
    "Mokameh", "Naubatpur", "Pandarak", "Paliganj", "Patna Sadar",
    "Phulwari", "Punpun", "Sampatchak",
  ],
  Purnia: [
    "Amour", "Baisi", "Banmankhi", "Barhara Kothi", "Bhawanipur",
    "Dhamdaha", "Jalalgarh", "Kasba", "Krityanand Nagar", "Purnia East",
    "Purnia West", "Rupauli", "Srinagar", "Bhawanipur Rajdham",
  ],
  Rohtas: [
    "Akorhigola", "Bikramganj", "Chenari", "Dawath", "Dehri",
    "Dinara", "Karakat", "Kochas", "Nasriganj", "Nauhatta",
    "Nokha", "Rajpur", "Rohtas", "Sanjhauli", "Sasaram",
    "Sheosagar", "Suryapura", "Tildanga", "Tilouthu",
  ],
  Saharsa: [
    "Banma Itahari", "Kahara", "Mahishi", "Nauhatta", "Patarghat",
    "Saharsa", "Salkhua", "Sattar Katiya", "Simri Bakhtiyarpur", "Sonbarsa",
  ],
  Samastipur: [
    "Bibhutipur", "Bithan", "Dalsinghsarai", "Hasanpur", "Kalyanpur",
    "Kalpatta", "Mohiuddinagar", "Morwa", "Muktapur", "Patori",
    "Rosera", "Samastipur", "Sarairanjan", "Shivajinagar", "Singhia",
    "Tadwa", "Tajpur", "Ujiyarpur", "Vaishali", "Warisnagar",
  ],
  Saran: [
    "Amnour", "Baniapur", "Chhapra", "Dariapur", "Dighwara",
    "Ekma", "Garkha", "Isuapur", "Jalalpur", "Lahladpur",
    "Maker", "Manjhi", "Marhaura", "Mashrak", "Nagra",
    "Panapur", "Parsa", "Revelganj", "Sonepur", "Taraiyan",
  ],
  Sheikhpura: [
    "Ariari", "Barbigha", "Chewara", "Ghat Kusumbha", "Sheikhpura", "Shekhopur Sarai",
  ],
  Sheohar: [
    "Dumri Katsari", "Piprahi", "Purnahiya", "Sheohar", "Tariyani",
  ],
  Sitamarhi: [
    "Bajpatti", "Bathnaha", "Belsand", "Bokhra", "Choraut",
    "Dumra", "Majorganj", "Nanpur", "Parihar", "Parsauni",
    "Pupri", "Riga", "Runni Saidpur", "Sitamarhi", "Sonbarsa",
    "Suppi", "Sursand",
  ],
  Siwan: [
    "Andhar Thakhari", "Barharia", "Basantpur", "Bhagwanpur Hat", "Darauli",
    "Darundha", "Gosain Sant", "Goriakothi", "Hussainganj", "Lakri Nabiganj",
    "Maharajganj", "Mairwa", "Nautan", "Pachrukhi", "Raghunathpur",
    "Siswan", "Siwan", "Sattar", "Ziradei",
  ],
  Supaul: [
    "Birpur", "Chhatapur", "Kishanpur", "Maraua", "Nirmali",
    "Pipra", "Pratapganj", "Raghopur", "Sadar", "Supaul", "Triveniganj",
  ],
  Vaishali: [
    "Bhagwanpur", "Bidupur", "Desri", "Goraul", "Hajipur",
    "Jandaha", "Lalganj", "Mahua", "Mahnar", "Moranwe",
    "Patepur", "Pater", "Raghopur", "Raja Pakar", "Sahdai Buzurg", "Vaishali",
  ],
  "West Champaran": [
    "Bagaha I", "Bagaha II", "Bairiya", "Bettiah", "Chanpatia",
    "Gaunaha", "Jogapatti", "Lauriya", "Madanpur", "Mainatand",
    "Narkatiaganj", "Nautan", "Piprasi", "Ramnagar", "Rampur",
    "Shikarganj", "Sikta", "Thakrahan",
  ],
};

// Sorted array of all 38 district names — use wherever only district dropdown is needed
export const BIHAR_DISTRICTS: string[] = Object.keys(biharDistricts).sort();

// Get prakhands for a district (safe — returns [] if not found)
export function getPrakhands(district: string): string[] {
  return biharDistricts[district] || [];
}

export default biharDistricts;
