"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const categories = await queryInterface.sequelize.query(
            `SELECT id, name FROM post_categories`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const catMap = {};
        categories.forEach(c => { catMap[c.name] = c.id; });

        await queryInterface.bulkInsert("posts", [
            {
                userId: 2,
                title: "Bingöl Üniversitesi",
                content: "merhaba arkadaşlar bingöl üniversitesinde iktisadi ve idari bilimler fakültesinde okumak sizce mantıklı mı aranızda orada okuyan varsa bölüm ortamını hocaları dersleri ve genel olarak memnun olup olmadığınızı anlatabilir misiniz teşekkürler",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-08-13 17:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 2,
                title: "Yüzen Adalar",
                content: "Yüzen adalarda piknik yapılmasına izin veriliyor mu? Daha önce giden var mı?",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-02-11 09:47:00"),
                updatedAt: new Date()
            },
            {
                userId: 2,
                title: "Uydukent Lezzetleri",
                content: "uydukentte önerebileceğiniz bir dönerci var mı",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-06-30 18:12:00"),
                updatedAt: new Date()
            },
            {
                userId: 2,
                title: "Zağ Mağaraları",
                content: "zağ mağaralarını bugün ilk defa gezme fırsatım oldu gerçekten beklediğimden çok daha güzeldi hem manzarası hem de tarihi atmosferi insanı etkiliyor bingöle yolu düşen varsa bence mutlaka uğrasın böyle güzel yerlerin daha fazla tanıtılması gerektiğini düşünüyorum",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-08-19 21:05:00"),
                updatedAt: new Date()
            },
            {
                userId: 2,
                title: "İş Fırsatları",
                content: "Bingöl'de hangi sektörlerde iş bulmak daha kolay? Kendi işini kurmak isteyenler için önerileriniz neler? Tecrübelerinizi paylaşalım.",
                categoryId: catMap["İş ve Kariyer"],
                createdAt: new Date("2026-04-03 10:26:00"),
                updatedAt: new Date()
            },
            {
                userId: 2,
                title: "Temmuz Ayında Bingöl'de Dağcılık",
                content: "bingöle dağcılık için geldim açıkçası beklediğimden daha güzel geçti hava da şartlar da gayet iyiydi biraz kafa dinlemek şehirden uzaklaşmak isteyen varsa bingöl dağına çıkmayı tavsiye ederim manzara ve ortam gerçekten çok ferahlatıcı.",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-07-14 16:41:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                title: "hali saha grubu",
                content: "beyler halı saha için 4 kişi lazım. yanıtlar kısmına instagramınızı yazın acilll",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-01-22 20:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                title: "bisiklet yolu",
                content: "kent parktaki bisiklet yolu gayet güzel. öneriyorum.",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-05-09 08:15:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                title: "Orman Yangınları",
                content: "Merhaba değerli üyeler. Bingöl'deki orman yangın sayısında şuanda artış var. Yangınlara %82 oranıyla piknik atıkları sebebiyet veriyor. Lütfen daha bilinçli olalım ve piknik sonrası 15 dakikamızı temizliğe verelim. Teşekkür ederim.",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-08-04 13:58:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                title: "kaza sayısında artış",
                content: "kaza oranları ciddi anlamda artıyor. lütfen hız limitlerine dikkat edelim ve emniyet kemerini unutmayalım. kazazedelerin pişmanlıklarını kendi gözlerimle görüyorum. lütfen dikkat edelim. en azından sizi sevenleri düşünün.",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-03-17 19:24:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                title: "Kahvaltı Mekanı",
                content: "hafta sonu ailemle kahvaltıya gitmeyi planlıyorum. önerebileceğiniz mekanlar var  mı? teşekkür ederim.",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-06-11 11:37:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                title: "Ev Taşıma",
                content: "Haftaya evimi taşıyacağım. Bingöl'de bildiğiniz uygun fiyatlı ev taşıma firması var mı?",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-02-27 15:49:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                title: "Ilıcalar",
                content: "Ilıcalardaki otellerde kalan var mı? Memnun musunuz?",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-07-25 09:02:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                title: "Dondurma Mekanı",
                content: "Bu sıcak havalarda serine ve dondurma yiyebilecegim bir mekan ariyorum. Bildiğiniz bir yer var mı?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-08-16 17:20:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                title: "Sürücü Kursu",
                content: "Şuan da bingöldeki en ucuz sürücü kursu hangisi?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-04-21 12:44:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                title: "balık tutma yerleri",
                content: "merkezde veya diğer ilçelerde balık tutmak için nereye gidebilirim?",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-05-28 22:07:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                title: "İş İlanları",
                content: "Bu sitedeki iş ilanların sayesinde işe başlayan biri var mı?",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-01-08 14:31:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                title: "Ev Kiraları",
                content: "3 yıldır bu şehirde kiraciyim. kira fiyatlari gercekten cok uygun. doger sehirlere göre gayet iyi",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-06-05 18:53:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                title: "Bingöldeki bölümler",
                content: "universitede okuyup bölümünden ve fakültesinden şikayetçi olan var mı? başka şehirde okumak istemiyorum ama bingöl üniversitesindeki öğrenci memnuniyetinide bilmiyorum.",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-03-02 10:16:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                title: "Piknik alanı",
                content: "Merkezde olan veya merkeze yakın olan piknik alanları var mı?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-08-21 09:48:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                title: "eleman ihtiyaci",
                content: "bingolde suanda en cok hangi sektorde eleman ihtiyaci var",
                categoryId: catMap["İş ve Kariyer"],
                createdAt: new Date("2026-07-02 16:29:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                title: "kasa toplanir mi",
                content: "bingolde bilgisayar kasasi toplayabilecegim bir magaza var mi",
                categoryId: catMap["Alım & Satım"],
                createdAt: new Date("2026-04-14 21:55:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                title: "Lahmacun",
                content: "lahmacun mekanlari önerebilir misiniz",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-05-16 12:03:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                title: "Nevada Kafe",
                content: "yeni açılan nevada kafeye giden var mı? ortamı nasıl?",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-02-04 19:38:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                title: "Bingöl'de Son Günlerde Trafik Yoğunluğu",
                content: "Son günlerde özellikle şehir merkezinde bazı saatlerde trafik yoğunluğu arttı. Özellikle iş çıkışı saatlerinde ana caddelerde ve kavşaklarda bekleme süreleri uzayabiliyor. Sizce Bingöl'de trafik konusunda en çok hangi bölgelerde düzenleme yapılması gerekiyor?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-08-08 15:26:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                title: "Bingöl'de sakin bir kahve içmek için neresi önerilir?",
                content: "Bingöl'de arkadaşlarla oturup biraz sohbet edebileceğimiz, çok kalabalık olmayan ve ortamı güzel bir kafe arıyoruz. Özellikle akşam saatlerinde gidebileceğimiz yer öneriniz varsa yazabilir misiniz?",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-06-22 20:14:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                title: "Bingöl'de Hafta Sonu Ne Yapılır?",
                content: "Hafta sonu şehirde vakit geçirmek için farklı bir şeyler yapmak istiyorum. Çok uzaklara gitmeden Bingöl'de yapılabilecek aktiviteler veya gidilebilecek yerler neler? Önerilerinizi paylaşabilir misiniz?",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-03-26 08:57:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                title: "Bingöl'de İş Bulmak İçin Hangi Alanlara Yönelmek Mantıklı?",
                content: "Bingöl'de iş arayan veya yeni mezun olan arkadaşlar için sizce şu anda hangi sektörlerde daha fazla iş imkanı var? Özellikle tecrübesiz birinin iş bulması açısından hangi alanları önerirsiniz?",
                categoryId: catMap["İş ve Kariyer"],
                createdAt: new Date("2026-07-19 13:42:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                title: "Bingöl Üniversitesi'nde Yeni Öğrenciler İçin Tavsiyeler",
                content: "Bu yıl Bingöl Üniversitesi'ne başlayacak arkadaşlar için özellikle dikkat edilmesi gereken şeyler neler? Dersler, hocalar, kampüs, ulaşım veya şehirde öğrenci olarak yaşamak konusunda tecrübelerinizi paylaşabilir misiniz?",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-01-30 17:09:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                title: "Bingöl Üniversitesi'nde KYK Yurtları Nasıl?",
                content: "Bu yıl üniversiteye başlayacağım ve KYK yurtları hakkında bilgi almak istiyorum. Yurtların şartları, odaları, yemekleri ve kampüse ulaşım konusunda deneyimi olanlar bilgi verebilir mi?",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-08-12 10:51:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                title: "Bingöl Üniversitesi'nde Öğrenci Olmak Nasıl?",
                content: "Bingöl Üniversitesi'nde okuyan arkadaşlar genel olarak üniversiteden memnun mu? Sosyal ortam, öğrenci kulüpleri ve kampüste yapılabilecek aktiviteler hakkında biraz bilgi verebilir misiniz?",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-05-03 22:36:00"),
                updatedAt: new Date()
            },
            {
                userId: 10,
                title: "Bingöl'de Akşamları Nerede Vakit Geçirilir?",
                content: "Akşamları arkadaşlarla oturup sohbet etmek veya biraz vakit geçirmek için Bingöl'de nereleri önerirsiniz? Özellikle sakin ve güzel yerler arıyoruz.",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-06-17 14:28:00"),
                updatedAt: new Date()
            },
            {
                userId: 10,
                title: "Bingöl'de Bu Yaz Etkinlikler Olacak mı?",
                content: "Yaz aylarında Bingöl'de konser, festival veya farklı etkinlikler düzenlenecek mi? Bildiğiniz etkinlikler varsa tarihleriyle birlikte paylaşabilir misiniz?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-02-19 11:05:00"),
                updatedAt: new Date()
            },
            {
                userId: 11,
                title: "Bingöl'de En Sevdiğiniz Mevsim Hangisi?",
                content: "Bingöl'de yaşayanlar olarak en çok hangi mevsimi seviyorsunuz? Kışın kar manzaraları mı, yoksa yazın sıcak havaları mı? Nedenini de merak ediyorum.",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-07-08 18:47:00"),
                updatedAt: new Date()
            },
            {
                userId: 11,
                title: "Bingöl'de Uygun Fiyatlı Spor Salonu Önerisi",
                content: "Bingöl'de spor salonuna yazılmayı düşünüyorum. Fiyatı uygun ve ekipmanları iyi olan bir salon önerir misiniz? Aylık ücretleri hakkında da bilgi verirseniz iyi olur.",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-04-27 09:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 12,
                title: "Bingöl'de Part Time İş Bulmak",
                content: "Öğrenciyim ve derslerden kalan zamanlarda çalışabileceğim part time bir iş arıyorum. Bingöl'de öğrencilerin çalışabileceği hangi işler var? Daha önce çalışan arkadaşlar varsa tecrübelerini paylaşabilir mi?",
                categoryId: catMap["İş ve Kariyer"],
                createdAt: new Date("2026-08-01 16:59:00"),
                updatedAt: new Date()
            },
            {
                userId: 12,
                title: "Bingöl Üniversitesi'nde Bölüm Değiştirmek",
                content: "Bingöl Üniversitesi'nde bölümünden memnun olmayan veya bölüm değiştiren arkadaşlar var mı? Yatay geçiş veya bölüm değişikliği süreci nasıl ilerliyor, tecrübesi olanlar paylaşabilir mi?",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-03-11 20:22:00"),
                updatedAt: new Date()
            },
            {
                userId: 13,
                title: "Bingöl'de Şehir İçinde Ulaşım Nasıl?",
                content: "Son zamanlarda şehir içinde ulaşım konusunda siz ne düşünüyorsunuz? Özellikle yoğun saatlerde otobüslerin durumu ve trafik hakkında görüşlerinizi merak ediyorum.",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-06-26 13:15:00"),
                updatedAt: new Date()
            },
            {
                userId: 13,
                title: "Bingöl'de Yaşamanın En Güzel Yanı Sizce Ne?",
                content: "Uzun zamandır Bingöl'de yaşayanlar, sizce bu şehrin en güzel tarafı nedir? Doğası, sakinliği, insanları veya başka bir şey? merak ediyorum.",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-01-15 08:40:00"),
                updatedAt: new Date()
            },
            {
                userId: 14,
                title: "Bingöl'de En Çok Sevdiğiniz Yer Neresi?",
                content: "Bingöl'de gezmeyi veya vakit geçirmeyi en sevdiğiniz yer neresi? Özellikle şehirde yeni yerler keşfetmek isteyenler için önerilerinizi paylaşabilir misiniz?",
                categoryId: catMap["Genel"],
                createdAt: new Date("2026-07-30 19:56:00"),
                updatedAt: new Date()
            },
            {
                userId: 15,
                title: "Bingöl'de Yeni Projeler ve Çalışmalar",
                content: "Son zamanlarda Bingöl'de yapılan veya yapılması planlanan yeni projeler hakkında neler düşünüyorsunuz? Şehrin gelişmesi için sizce öncelikli olarak hangi alanlara yatırım yapılmalı?",
                categoryId: catMap["Gündem"],
                createdAt: new Date("2026-05-21 15:12:00"),
                updatedAt: new Date()
            },
            {
                userId: 16,
                title: "Bingöl'de Uygun Fiyatlı Ev Nerede Bulabilirim?",
                content: "Önümüzdeki aylarda Bingöl'e taşınmayı düşünüyorum. Merkeze çok uzak olmayan, kira açısından daha uygun mahalleler hangileri? Ev kiralayan veya bu konuda bilgisi olanlar önerilerini paylaşabilir mi?",
                categoryId: catMap["Soru & Cevap"],
                createdAt: new Date("2026-02-14 12:58:00"),
                updatedAt: new Date()
            },
            {
                userId: 17,
                title: "Bingöl'de İş Başvurusu Yaparken Nelere Dikkat Etmeli?",
                content: "Bingöl'de iş arıyorum ve farklı yerlere başvuru yapmayı düşünüyorum. Daha önce iş başvurusu yapan arkadaşlar, özellikle CV hazırlama ve iş görüşmesi konusunda nelere dikkat etmem gerektiğini paylaşabilir mi?",
                categoryId: catMap["İş ve Kariyer"],
                createdAt: new Date("2026-08-17 10:34:00"),
                updatedAt: new Date()
            },
            {
                userId: 18,
                title: "İkinci El Bisiklet Arıyorum",
                content: "Bingöl'de uygun fiyatlı, temiz durumda ikinci el bisiklet arıyorum. Satmak isteyen varsa modelini, durumunu ve fiyatını yazabilir mi?",
                categoryId: catMap["Alım & Satım"],
                createdAt: new Date("2026-04-08 21:47:00"),
                updatedAt: new Date()
            },
            {
                userId: 19,
                title: "Bingöl Üniversitesi'nde Sınavlar Nasıl Geçiyor?",
                content: "Bingöl Üniversitesi'nde okuyan arkadaşlar sınavların genel olarak nasıl geçtiğini söyleyebilir mi? Derslere düzenli çalışmak yeterli oluyor mu, yoksa sınavlar zorlayıcı mı?",
                categoryId: catMap["Üniversite"],
                createdAt: new Date("2026-03-23 14:05:00"),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("posts", null, {});
    }
};
