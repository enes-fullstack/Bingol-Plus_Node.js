"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const replies = [
            {
                postId: 1,
                userId: 3,
                content: "Ben de Bingöl Üniversitesinde okuyorum. Genel olarak memnunum, özellikle hocaların çoğu ilgili",
                createdAt: new Date("2026-01-01 08:00:00"),
                updatedAt: new Date()
            },
            {
                postId: 1,
                userId: 5,
                content: "Bölüme göre değişiyor ama şehir dışında okumak istemiyorsan bence değerlendirilebilir.",
                createdAt: new Date("2026-01-02 15:13:00"),
                updatedAt: new Date()
            },
            {
                postId: 1,
                userId: 7,
                content: "benim arkadaşım orda okuyor, derslerin çok zor olmadığını söylüyor",
                createdAt: new Date("2026-01-03 08:26:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 2,
                content: "Ben geçen yaz gitmiştim piknik yapanlar vardı ama çok kalabalık değildi. Yiyecek içecek götürmüştük herhangi bi sorun olmadı",
                createdAt: new Date("2026-01-04 15:39:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 2,
                content: "Piknik için uygun bi yer ama çok fazla eşya götürmemek lazım. Biz gittiğimizde oturup çay içenler falan vardı",
                createdAt: new Date("2026-01-06 08:52:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                postId: 2,
                content: "İzin konusunda bi bilgim yok ama geçen sene gittiğimde yapan çok kişi vardı zaten. Sabah erken giderseniz daha güzel olur bence",
                createdAt: new Date("2026-01-07 15:05:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 3,
                content: "Ben genelde Hobim dönerden alıyorum gayet güzel yapıyorlar eti de fena değil",
                createdAt: new Date("2026-01-08 08:18:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 3,
                content: "Uydukentte bi kaç yer denedim ama en çok erdemi beğendim porsiyonları da iyi",
                createdAt: new Date("2026-01-10 15:31:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 3,
                content: "Döner konusunda çok seçici değilim ama geçenlerde öncü dönerden yedim. çok ağırdı",
                createdAt: new Date("2026-01-11 08:44:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 4,
                content: "Ben de geçen sene gitmiştim gerçekten güzel bi yer özellikle yukarıdan manzara baya iyi",
                createdAt: new Date("2026-01-12 15:57:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 4,
                content: "Çocukken gitmiştim şimdi tekrar gitmek lazım demek ki baya değişmiş. Bingölde böyle yerlerin olduğunu çoğu kişi bilmiyor",
                createdAt: new Date("2026-01-14 08:10:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 4,
                content: "Geçen ay gittik bizde çok beğendik ama yol biraz sıkıntılıydı onun dışında gayet güzel bi yer",
                createdAt: new Date("2026-01-15 15:23:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 5,
                content: "Bence tekstil ve hizmet sektöründe iş bulmak biraz daha kolay. Ama maaşlar her yerde aynı değil bazı yerlerde gerçekten düşük kalıyor",
                createdAt: new Date("2026-01-16 08:36:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 5,
                content: "Kendi işini kuracaksan küçük bi dükkan açmak yerine internet üzerinden bişeyler satmak daha mantıklı olabilir. Bingölde müşteri bulmak bazen zor oluyor",
                createdAt: new Date("2026-01-17 15:49:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 5,
                content: "İş bulmak kolay diyenlere pek katılmıyorum açıkçası. Tecrüben yoksa çoğu yer ya çok az maaş veriyor yada eleman aramıyoruz diyor",
                createdAt: new Date("2026-01-19 08:02:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 6,
                content: "Yazın gitmek gerçekten güzel oluyor ama bazı yerlerde yol baya yoruyor. Onun dışında manzarası için kesinlikle değer",
                createdAt: new Date("2026-01-20 15:15:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 6,
                content: "Ben geçen sene çıkmıştım hava bi anda değişmişti hazırlıksız gitmemek lazım. Manzara konusunda gerçekten güzel",
                createdAt: new Date("2026-01-21 08:28:00"),
                updatedAt: new Date()
            },
            {
                userId: 3,
                postId: 6,
                content: "Dağcılık için güzel olabilir ama profesyonel değilseniz tek başınıza çıkmanızı pek önermem. Bazı bölgeler düşündüğünüzden daha zor",
                createdAt: new Date("2026-01-23 15:41:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 7,
                content: "Ben gelirim ama saat kaçta oynanacak ona göre bakayım",
                createdAt: new Date("2026-01-24 08:54:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 7,
                content: "Bende gelirim insta: emre.bingol23 yaz ordan konuşuruz",
                createdAt: new Date("2026-01-25 15:07:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 7,
                content: "Ben gelemem bugün ama akşam için adam bulamazsanız haber verin belki ayarlarım",
                createdAt: new Date("2026-01-27 08:20:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 7,
                content: "kaçta oynuyosunuz beyler bende gelebilirim",
                createdAt: new Date("2026-01-28 15:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 8,
                content: "Ben de kullanıyorum ara sıra özellikle akşam saatlerinde güzel oluyor",
                createdAt: new Date("2026-02-01 08:46:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 8,
                content: "Yol güzel ama bazı yerleri biraz bakımsız kalmış. Daha sık temizlense daha iyi olur",
                createdAt: new Date("2026-02-02 15:59:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 8,
                content: "Bisikletim yok ama yürüyüş için kullanıyorum bende gayet güzel bi yer",
                createdAt: new Date("2026-02-04 08:12:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 8,
                content: "Haftasonu çok kalabalık oluyor bence. Bisiklet sürmekten çok insanlara çarpmamaya çalışıyosun bazen",
                createdAt: new Date("2026-02-05 15:25:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 8,
                content: "Geçen gün gittim yolun bazı kısımları hoşuma gitmedi ama genel olarak fena değil",
                createdAt: new Date("2026-02-06 08:38:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 9,
                content: "Gerçekten dikkat etmek lazım özellikle cam şişeleri ormanda bırakıyorlar sonra yangın çıkınca herkes şaşırıyor",
                createdAt: new Date("2026-02-08 15:51:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 9,
                content: "Piknik yapanların çoğu çöplerini topluyor ama bazıları gerçekten hiç düşünmüyor. geçen hafta gördüm adam çöpleri bırakıp gitmiş",
                createdAt: new Date("2026-02-09 08:04:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 10,
                content: "Son zamanlarda gerçekten çok arttı özellikle şehir içinde hız yapan çok kişi var. Bir yere yetişmek için değmez bence",
                createdAt: new Date("2026-02-10 15:17:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 10,
                content: "Emniyet kemeri konusunda katılıyorum ama yolların bazı yerleride çok kötü. Sadece sürücülere yüklenmemek lazım",
                createdAt: new Date("2026-02-12 08:30:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 10,
                content: "Geçen ay ben de kaza gördüm insan görünce gerçekten hızın ne kadar tehlikeli olduğunu anlıyor. dikkat etmek lazım",
                createdAt: new Date("2026-02-13 15:43:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 10,
                content: "Bence en büyük sorun telefon kullanımı. Kırmızı ışıkta bile telefona bakan çok kişi var sonra kaza olunca şaşırıyoruz",
                createdAt: new Date("2026-02-14 08:56:00"),
                updatedAt: new Date()
            },

            {
                userId: 5,
                postId: 11,
                content: "Ben genelde ailemle açık alana gidiyorum kahvaltıyı doğa ile yapmak çok iyi hissettiriyor",
                createdAt: new Date("2026-02-15 15:09:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 11,
                content: "Birkaç yere gittik ama açıkçası çok beğenmedim. Fiyatına göre porsiyonlar biraz az geldi bana",
                createdAt: new Date("2026-02-17 08:22:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 11,
                content: "Çarşı tarafında da güzel yerler var ama haftasonu çok kalabalık oluyo. erken giderseniz daha rahat edersiniz",
                createdAt: new Date("2026-02-18 15:35:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 12,
                content: "Ben geçen sene barış nakliyat ile taşınmıştım gayet düzgün çalıştılar. Fiyatıda diğerlerine göre uygundu ama ismini hatırlamıyorum",
                createdAt: new Date("2026-02-19 08:48:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 12,
                content: "Firma ismi bilmiyorum ama birkaç yerden fiyat almanı öneririm. Aralarında baya fark çıkıyor",
                createdAt: new Date("2026-02-21 15:01:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 12,
                content: "Bizim taşımada eşyaların bi kaç tanesi zarar görmüştü o yüzden firma seçerken dikkat etmek lazım. Ucuz diye direkt atlamayın",
                createdAt: new Date("2026-02-22 08:14:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 12,
                content: "Ben olsam nakliyeciden önce tanıdıklara sorarım. Bingölde bu işlerde referansla gitmek daha mantıklı bence",
                createdAt: new Date("2026-02-23 15:27:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 13,
                content: "Geçen yaz kalmıştık biz gayet memnun olduk. Özellikle akşamları havası çok güzel oluyo",
                createdAt: new Date("2026-02-25 08:40:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 13,
                content: "Ben pek memnun kalmadım açıkçası odalar biraz eskiydi. Termal kısmı güzeldi ama",
                createdAt: new Date("2026-02-26 15:53:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 13,
                content: "Otel olarak çok bi beklentiniz yoksa gidilir bence. Zaten asıl güzel olan Ilıcaların kendisi",
                createdAt: new Date("2026-02-27 08:06:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 14,
                content: "Çarşı tarafında bi dondurmacı var ben ordan alıyorum genelde dondurması güzel ve fiyatlarıda normal",
                createdAt: new Date("2026-02-28 15:19:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 14,
                content: "Ben geçen gün denedim ama pek beğenmedim açıkçası. Dondurması biraz fazla şekerli geldi",
                createdAt: new Date("2026-03-02 08:32:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 14,
                content: "Akşam saatlerinde dışarı çıkacaksanız park tarafında da bi kaç yer var. Ben oraları daha çok seviyorum",
                createdAt: new Date("2026-03-03 15:45:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 14,
                content: "Sıcaklarda dondurma iyi gidiyo valla bende mekan arıyorum yorumları takip edeyim",
                createdAt: new Date("2026-03-04 08:58:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 14,
                content: "Benim bildiğim bi yer var ama ismini unuttum 😄 bulursam yazarım buraya",
                createdAt: new Date("2026-03-06 15:11:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 15,
                content: "Ben bu sene araştırdım kursların fiyatları birbirine çok yakın. Kayıt olmadan önce birkaç yeri arayıp sormak daha iyi olur",
                createdAt: new Date("2026-03-07 08:24:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 15,
                content: "Fiyat olarak en uygunu hangisi bilmiyorum ama ben geçen sene garantiye gitmiştim memnun kalmadım. Hocalar biraz ilgisizdi",
                createdAt: new Date("2026-03-08 15:37:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 15,
                content: "Kursun fiyatından çok direksiyon dersinin kaç saat olduğuna bak bence. Bazıları ucuz gösterip dersi az veriyo",
                createdAt: new Date("2026-03-10 08:50:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 15,
                content: "Ben merkezdeki kursların çoğuna sordum aşağı yukarı aynı fiyat verdiler. Pazarlık yapınca biraz düşürüyorlar bazen",
                createdAt: new Date("2026-03-11 15:03:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 16,
                content: "Karlıova tarafında balık tutan çok kişi var diye biliyorum. Merkezde de baraj taraflarına gidenler oluyo",
                createdAt: new Date("2026-03-12 08:16:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 16,
                content: "Ben geçen yaz Genç tarafına gitmiştim ama pek balık çıkmadı. Yerini bilen biri varsa bende takipteyim",
                createdAt: new Date("2026-03-13 15:29:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 16,
                content: "Solhan tarafında güzel yerler var diye duymuştum. Ama her yerde balık tutmaya izin var mı bilmiyorum",
                createdAt: new Date("2026-03-15 08:42:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 16,
                content: "Biz arkadaşlarla baraj tarafına gidiyoruz ara sıra, genelde sazan çıkıyor. Sabah erken gitmek daha iyi oluyo",
                createdAt: new Date("2026-03-16 15:55:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 16,
                content: "Balık işinden pek anlamıyorum ama ben olsam göl kenarında sakin bi yer bulup denerdim 😄",
                createdAt: new Date("2026-03-17 08:08:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 17,
                content: "Benim bi arkadaşım burdaki ilanlardan görüp işe girmişti. İlanı veren yerle direk görüşmüşlerdi",
                createdAt: new Date("2026-03-19 15:21:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 17,
                content: "Ben başvurdum ama geri dönüş olmadı. Yine de ilanların olması iyi bence başka yerlerden bulmak zor oluyo",
                createdAt: new Date("2026-03-20 08:34:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 17,
                content: "Ben daha önce bi ilana başvurmuştum işe alınmadım ama sonradan başka bi iş buldum burdan. O yüzden site işe yarıyor diyebilirim",
                createdAt: new Date("2026-03-21 15:47:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 17,
                content: "Bende birkaç ilana baktım ama çoğunun şartları bana uymadı. Uygun bi ilan çıkarsa başvuracam",
                createdAt: new Date("2026-03-23 08:00:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 18,
                content: "Bingöl için kiralar gerçekten diğer büyük şehirlere göre uygun. Ama son zamanlarda baya arttı yinede",
                createdAt: new Date("2026-03-24 15:13:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 18,
                content: "Uygun denebilir ama merkezi yerlerde fiyatlar artık eskisi gibi değil. 2 sene önceki kiralarla karşılaştırınca fark var",
                createdAt: new Date("2026-03-25 08:26:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 18,
                content: "Ben de 2 yıldır kiracıyım açıkcası memnunum. İstanbul gibi yerlerle kıyaslayınca gerçekten çok daha rahat",
                createdAt: new Date("2026-03-26 15:39:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 19,
                content: "Ben üniversitede okuyorum genel olarak memnunum ama bazı bölümlerde hocalara ulaşmak biraz zor olabiliyor",
                createdAt: new Date("2026-03-28 08:52:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 19,
                content: "Bölüme göre çok değişiyo bence. Kendi bölümümden memnunum ama arkadaşlarımın bazıları baya şikayetçi",
                createdAt: new Date("2026-04-01 15:05:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 19,
                content: "Benim bölümümde dersler fena değil ama sosyal ortam biraz zayıf. Büyük şehirdeki üniversiteler gibi bi ortam beklememek lazım",
                createdAt: new Date("2026-04-02 08:18:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 19,
                content: "Üniversiteyi genel olarak seviyorum ama bazı imkanlar daha iyi olabilirdi. özellikle kampüs tarafında eksikler var",
                createdAt: new Date("2026-04-04 15:31:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 20,
                content: "Kent Park tarafında güzel yerler var. Haftasonu biraz kalabalık oluyo ama aileyle gidilir",
                createdAt: new Date("2026-04-05 08:44:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 20,
                content: "Çapakçur tarafında da piknik yapan çok kişi var. Merkezden biraz uzak ama ortamı daha sakin",
                createdAt: new Date("2026-04-06 15:57:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 20,
                content: "Ben genelde şehir dışına doğru gidiyorum. Merkeze yakın yerler bana biraz kalabalık geliyo",
                createdAt: new Date("2026-04-08 08:10:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 21,
                content: "Bence tekstil ve inşaat tarafında sürekli eleman aranıyor. Tecrüben varsa iş bulmak biraz daha kolay oluyo",
                createdAt: new Date("2026-04-09 15:23:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 21,
                content: "Benim gördüğüm kadarıyla market ve restoranlarda da eleman arayan çok. Ama çalışma saatleri biraz sıkıntılı olabiliyor",
                createdAt: new Date("2026-04-10 08:36:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 21,
                content: "Sağlık sektöründe de ihtiyaç var diye biliyorum ama çoğu ilan tecrübe veya bölüm istiyor",
                createdAt: new Date("2026-04-11 15:49:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 21,
                content: "Vasıfsız işlerde ilan çok ama maaşlar genelde düşük. düzgün maaş veren yer bulmak daha zor",
                createdAt: new Date("2026-04-13 08:02:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 22,
                content: "Çarşıda bilgisayarcıların çoğu kasa topluyor diye biliyorum. Parçaları kendin seçersen daha iyi olur bence",
                createdAt: new Date("2026-04-14 15:15:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 22,
                content: "Ben geçen sene bi bilgisayarcıya toplatmıştım gayet güzel ilgilendiler. İsmini hatırlamıyorum ama çarşı tarafındaydı",
                createdAt: new Date("2026-04-15 08:28:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 22,
                content: "Toplatmadan önce internetten parça fiyatlarına bak derim bazı yerlerde baya fark oluyo",
                createdAt: new Date("2026-04-17 15:41:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 23,
                content: "Çarşıda bi kaç yerde güzel lahmacun yapılıyor. Ben genelde paket alıyorum sıcak sıcak iyi oluyo",
                createdAt: new Date("2026-04-18 08:54:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 23,
                content: "Ben şu sıralar bi yerde yiyorum ama geçenlerde tadı pek iyi değildi. Eskiden daha güzeldi sanki",
                createdAt: new Date("2026-04-19 15:07:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 23,
                content: "Lahmacunun yanında ayran da önemli bence 😄 bazı yerlerin lahmacunu güzel ama ayranı hiç iyi değil",
                createdAt: new Date("2026-04-21 08:20:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 23,
                content: "Ben de mekan arıyorum açıkcası güzel bi yer bilen varsa yazsın",
                createdAt: new Date("2026-04-22 15:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 24,
                content: "Ben gittim geçenlerde, ortamı baya güzel olmuş. İçerisi biraz küçük ama dekorasyonu hoşuma gitti",
                createdAt: new Date("2026-04-23 08:46:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 24,
                content: "Ben pek beğenmedim açıkçası, biraz kalabalıktı ve servisde yavaştı. Yeni açıldığı için olabilir tabi",
                createdAt: new Date("2026-04-24 15:59:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 24,
                content: "Kahveleri fena değil ama fiyatlar biraz yüksek geldi bana. Bi kaç kere daha gider miyim bilmiyorum",
                createdAt: new Date("2026-04-26 08:12:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 25,
                content: "Özellikle akşam 5-7 arası ana caddeler baya sıkışıyor. Çarşı girişinde biraz düzenleme yapılsa rahatlar bence",
                createdAt: new Date("2026-04-27 15:25:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 25,
                content: "Kavşaklarda ışık süreleri de biraz sorunlu bence. Bazen bomboş yolda bekliyosun sonra bi anda herkes birikiyor",
                createdAt: new Date("2026-04-28 08:38:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 25,
                content: "Bence asıl sorun çift sıra park edenler. Yol zaten dar, birde arabayı bırakıp gidince trafik iyice kilitleniyor",
                createdAt: new Date("2026-05-02 15:51:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 25,
                content: "Son zamanlarda gerçekten arttı ama yaz aylarında şehirde araç sayısı da çoğaldı. Kışın biraz daha rahat oluyor",
                createdAt: new Date("2026-05-03 08:04:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 26,
                content: "Bayram Pide'nin üst tarafında bi kafe var, akşamları genelde sakin oluyor. Arkadaşlarla oturmak için güzel",
                createdAt: new Date("2026-05-04 15:17:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 26,
                content: "Nevada Kafe çok kalabalık değilse orası da olabilir. Ben daha önce gitmiştim ortamı fena değildi",
                createdAt: new Date("2026-05-06 08:30:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 26,
                content: "Çarşıdaki kafeler akşam baya kalabalık oluyo. Biraz daha ara sokaklarda olan yerlere bakın derim",
                createdAt: new Date("2026-05-07 15:43:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 27,
                content: "Haftasonu Yüzen Adalara gidilebilir bence. Çok uzak değil hemde ortamı güzel oluyor",
                createdAt: new Date("2026-05-08 08:56:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 27,
                content: "Ben genelde Kent Parkta oturuyorum ama farklı bişey yapmak istiyosanız Ilıcalar tarafına da gidilebilir",
                createdAt: new Date("2026-05-09 15:09:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 27,
                content: "Arkadaşlarla bisiklet sürmekte güzel oluyor. Çok fazla aktivite yok açıkcası ama günübirlik gezilecek yerler var",
                createdAt: new Date("2026-05-11 08:22:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 27,
                content: "Zağ Mağaralarına gitmediyseniz tavsiye ederim. Geçen hafta gittik manzarası baya güzeldi",
                createdAt: new Date("2026-05-12 15:35:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 28,
                content: "Tecrübesiz biri için market ve mağazalarda iş bulmak daha kolay olabilir. Maaşlar çok yüksek değil ama başlangıç için iş görür",
                createdAt: new Date("2026-05-13 08:48:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 28,
                content: "Tekstil tarafında da sürekli eleman aranıyor diye görüyorum. Ama çalışma saatleri uzun olabiliyor",
                createdAt: new Date("2026-05-15 15:01:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 28,
                content: "Bilgisayar konusunda biraz bilgin varsa teknik servis veya satış tarafına bakabilirsin. Ben öyle başlamıştım",
                createdAt: new Date("2026-05-16 08:14:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 28,
                content: "İş ilanlarına düzenli bakmak lazım. Bazen hiç ilan yok gibi duruyor ama bir kaç gün sonra yeni ilanlar geliyor",
                createdAt: new Date("2026-05-17 15:27:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 29,
                content: "İlk başta kampüsü öğrenmeye çalışın yeter 😄 Derslikleri bulmak bazen düşündüğünüzden zor oluyo",
                createdAt: new Date("2026-05-19 08:40:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 29,
                content: "Ulaşım çok sıkıntı değil ama yurtta kalacaksanız erken araştırın. Sonradan yer bulmak zor olabiliyor",
                createdAt: new Date("2026-05-20 15:53:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 29,
                content: "Hocalarla iletişim kurmaktan çekinmeyin. Ben ilk sene hiç soru sormuyodum sonra derslerde baya zorlandım",
                createdAt: new Date("2026-05-21 08:06:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 29,
                content: "Şehir küçük olduğu için alışmak çok zor değil bence. Kampüs ile merkez arasında gidip gelmekte kolay",
                createdAt: new Date("2026-05-22 15:19:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 29,
                content: "Üniversitede her duyduğunuza inanmayın özellikle ders seçimi konusunda öğrenci işlerinden teyit edin. Ben ilk sene yanlış bilgi yüzünden uğraşmıştım",
                createdAt: new Date("2026-05-24 08:32:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 30,
                content: "Ben yurtta kalıyorum genel olarak fena değil. Odalar 4 kişilik diye biliyorum ama binaya göre değişebiliyor",
                createdAt: new Date("2026-05-25 15:45:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 30,
                content: "Yemekler her gün aynı kalitede olmuyor açıkcası. Bazen güzel çıkıyor bazen dışardan söylemek istiyosun",
                createdAt: new Date("2026-05-26 08:58:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 30,
                content: "Kampüse ulaşım konusunda çok sıkıntı yaşamadım. Sabah saatlerinde otobüsler biraz dolu oluyo ama",
                createdAt: new Date("2026-05-28 15:11:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 30,
                content: "Yurda çıkmadan önce oda arkadaşları konusunda biraz şans işi. Ben iyi insanlarla kaldım o yüzden sorun yaşamadım",
                createdAt: new Date("2026-06-01 08:24:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 31,
                content: "Ben genel olarak memnunum. Şehir küçük olduğu için sosyal ortam büyük şehirlere göre biraz sınırlı ama alışınca sıkıntı olmuyor",
                createdAt: new Date("2026-06-02 15:37:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 31,
                content: "Kulüpler var ama çok aktif olanların sayısı fazla değil. Biraz daha etkinlik olsa güzel olurdu",
                createdAt: new Date("2026-06-04 08:50:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 31,
                content: "Kampüsün ortamı güzel bence özellikle havalar iyi olduğunda arkadaşlarla oturup vakit geçirilecek yerler var",
                createdAt: new Date("2026-06-05 15:03:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 31,
                content: "Ben açıkcası üniversiteden çok memnun değilim. Eğitim açısından bölüme göre değişiyor ama sosyal hayat biraz zayıf kalıyor",
                createdAt: new Date("2026-06-06 08:16:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 32,
                content: "Akşamları Kent Park tarafı güzel oluyor. Çok sakin olsun diyosanız biraz daha geç saatlerde gitmek lazım",
                createdAt: new Date("2026-06-07 15:29:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 32,
                content: "Çarşıdaki kafelerde oturulabilir ama haftasonu baya kalabalık oluyor. Biz genelde Nevada Kafeye gidiyoruz",
                createdAt: new Date("2026-06-09 08:42:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 32,
                content: "Ben arkadaşlarla genelde yürüyüş yapıyorum sonra bi yerde çay içiyoruz. Bingölde çok fazla seçenek yok zaten",
                createdAt: new Date("2026-06-10 15:55:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 32,
                content: "Ilıcalar akşam için güzel olabilir ama her gün gidilmez tabi. Merkezde sakin bi kafe bulmak daha mantıklı",
                createdAt: new Date("2026-06-11 08:08:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 33,
                content: "Yazın genelde belediyenin etkinlikleri oluyor diye biliyorum. Kesin tarihleri açıklanınca zaten duyurulur",
                createdAt: new Date("2026-06-13 15:21:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 33,
                content: "Geçen sene birkaç konser olmuştu ama bu sene ne olacak bilmiyorum. Bende takip ediyorum",
                createdAt: new Date("2026-06-14 08:34:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 33,
                content: "Etkinlik olsa güzel olur ama Bingölde çok sık yapılmıyor malesef. Özellikle gençlere yönelik daha fazla şey yapılabilir",
                createdAt: new Date("2026-06-15 15:47:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 34,
                content: "Ben yazı daha çok seviyorum. Akşamları dışarda oturmak falan güzel oluyor ama çok sıcak olduğunda da çekilmiyo",
                createdAt: new Date("2026-06-17 08:00:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 34,
                content: "Kışın kar yağdığı zaman Bingöl çok güzel oluyo ama soğuğu hiç çekemiyorum. O yüzden sonbahar daha iyi bence",
                createdAt: new Date("2026-06-18 15:13:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 34,
                content: "Ben kışı seviyorum açıkcası. Kar yağınca şehir daha güzel bi hale geliyor, yazın sıcağından da hiç hoşlanmıyorum",
                createdAt: new Date("2026-06-19 08:26:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 34,
                content: "İlkbahar en iyisi bence ne çok sıcak ne çok soğuk. Bingölde hava bi anda değişebiliyor ama 😄",
                createdAt: new Date("2026-06-20 15:39:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 35,
                content: "Ben geçen sene bi salona gitmiştim fiyatı uygundu ekipmanlarda fena değildi. Akşam saatleri biraz kalabalık oluyodu sadece",
                createdAt: new Date("2026-06-22 08:52:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 35,
                content: "Çarşı tarafında bi salon var arkadaşım gidiyor, aylık fiyatı çok yüksek değil diye biliyorum. İsmini sorup yazabilirim",
                createdAt: new Date("2026-06-23 15:05:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 35,
                content: "Benim gittiğim salonun ekipmanları iyi ama fiyatı biraz pahalı. Ucuz bi yer arıyosanız başka yerlere bakmak lazım",
                createdAt: new Date("2026-06-24 08:18:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 36,
                content: "Kafelerde veya restoranlarda part time iş bulabilirsin. Ben öğrenciyken bi kafede çalışmıştım, derslere göre saatleri ayarlıyolardı",
                createdAt: new Date("2026-06-26 15:31:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 36,
                content: "Marketlerde de part time çalışan öğrenciler var. Ama bazı yerlerde çalışma saatleri baya uzun olabiliyor ona dikkat et",
                createdAt: new Date("2026-06-27 08:44:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 36,
                content: "Ben bi ara garsonluk yapıyodum, para olarak çok fazla değildi ama öğrenci için idare ediyodu. Bahşişte olunca biraz rahatlıyodu",
                createdAt: new Date("2026-06-28 15:57:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 36,
                content: "İş ilanlarına da bak derim. Özellikle yaz aylarında part time eleman arayan yerler daha fazla çıkıyor",
                createdAt: new Date("2026-07-02 08:10:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 37,
                content: "Ben bölüm değiştirmedim ama arkadaşım yatay geçiş yapmıştı. Evrak işleri biraz uğraştırmıştı, öğrenci işlerinden detaylı bilgi almak lazım",
                createdAt: new Date("2026-07-03 15:23:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 37,
                content: "Bölüm değiştirmek kolay değil diye biliyorum. Kontenjan ve not ortalaması gibi şartlara bakıyorlar, bölüme görede değişebilir",
                createdAt: new Date("2026-07-04 08:36:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 37,
                content: "Ben yatay geçiş düşünmüştüm ama şartları görünce vazgeçtim. Özellikle kontenjan işi biraz sıkıntı olabiliyor",
                createdAt: new Date("2026-07-05 15:49:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 38,
                content: "Yoğun saatlerde otobüsler baya dolu oluyo özellikle sabah. Biraz daha fazla sefer olsa iyi olur",
                createdAt: new Date("2026-07-07 08:02:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 38,
                content: "Ben genelde kendi arabamla gidiyorum ama trafik yüzünden bazen otobüsten daha geç varıyorum. Çarşı tarafı özellikle sıkıntılı",
                createdAt: new Date("2026-07-08 15:15:00"),
                updatedAt: new Date()
            },
            {
                userId: 5,
                postId: 38,
                content: "Otobüslerin saatleri konusunda bi sıkıntı var bence. Bazı saatlerde peş peşe geliyor sonra uzun süre gelmiyo",
                createdAt: new Date("2026-07-09 08:28:00"),
                updatedAt: new Date()
            },

            {
                userId: 7,
                postId: 39,
                content: "Bence en güzel tarafı sakin olması. Büyük şehirlerdeki gibi sürekli bi koşuşturma yok",
                createdAt: new Date("2026-07-11 15:41:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 39,
                content: "Doğası kesinlikle. Özellikle yazın şehir dışına çıkınca çok güzel yerler var",
                createdAt: new Date("2026-07-12 08:54:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 39,
                content: "İnsanları iyi ama sosyal imkanlar biraz az bence. Gençler için daha fazla aktivite olsa güzel olur",
                createdAt: new Date("2026-07-13 15:07:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 39,
                content: "Benim için aileme yakın olması. Başka şehirde yaşasam bu kadar rahat edemezdim açıkcası",
                createdAt: new Date("2026-07-15 08:20:00"),
                updatedAt: new Date()
            },

            {
                userId: 5,
                postId: 40,
                content: "Yüzen Adaları seviyorum ben. Özellikle kalabalık olmadığı zamanlar baya güzel oluyor",
                createdAt: new Date("2026-07-16 15:33:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 40,
                content: "Zağ Mağaralarına gitmediyseniz gidin derim. Manzarası gerçekten güzel",
                createdAt: new Date("2026-07-17 08:46:00"),
                updatedAt: new Date()
            },

            {
                userId: 7,
                postId: 41,
                content: "Bence öncelikle yollar ve ulaşım konusunda çalışmalar yapılmalı. Bazı yerlerde trafik ciddi sıkıntı",
                createdAt: new Date("2026-07-18 15:59:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 41,
                content: "Gençlere yönelik sosyal alanlar artsa güzel olur. Şehirde yapılacak şeyler biraz sınırlı kalıyor",
                createdAt: new Date("2026-07-20 08:12:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 41,
                content: "Yeni binalardan çok mevcut yerlerin düzenlenmesi lazım bence. Parklar ve kaldırımların bazıları baya eski",
                createdAt: new Date("2026-07-21 15:25:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 41,
                content: "İş imkanlarıda önemli. Gençler mezun olunca şehirde kalacak iş bulamayınca gitmek zorunda kalıyor",
                createdAt: new Date("2026-07-22 08:38:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 41,
                content: "Projeler yapılıyor ama bazıları çok yavaş ilerliyo. Başlanan işlerin zamanında bitirilmesi daha önemli bence",
                createdAt: new Date("2026-07-24 15:51:00"),
                updatedAt: new Date()
            },

            {
                userId: 5,
                postId: 42,
                content: "Merkeze yakın olup biraz daha uygun yer arıyosanız Yenişehir taraflarına bakabilirsiniz. Evden eve değişiyo tabi",
                createdAt: new Date("2026-07-25 08:04:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 42,
                content: "Uydukentte de uygun ev bulunabiliyor ama merkeze göre biraz daha uzak kalıyor",
                createdAt: new Date("2026-07-26 15:17:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 42,
                content: "Ben kiralık ev bakarken fiyatlar çok değişiyodu. Aynı büyüklükte evlerin arasında bile baya fark vardı",
                createdAt: new Date("2026-07-28 08:30:00"),
                updatedAt: new Date()
            },
            {
                userId: 6,
                postId: 43,
                content: "CV'yi çok uzatmaya gerek yok bence. Daha önce yaptığın işler ve bildiğin şeyler net şekilde yazsın yeter",
                createdAt: new Date("2026-08-01 15:43:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 43,
                content: "Görüşmede maaşı sormaktan çekinme ama ilk dakikada da sormamak lazım 😄 Ben bi kere direkt sormuştum biraz garip olmuştu",
                createdAt: new Date("2026-08-02 08:56:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 43,
                content: "Tecrüben yoksa bile yaptığın stajları veya kısa süreli işleri yaz. Hiç bişey yazmadan başvurmak daha kötü",
                createdAt: new Date("2026-08-03 15:09:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 43,
                content: "Bingölde tanıdıkla işe girme olayı biraz fazla bence. CV ne kadar iyi olursa olsun bazen ilan bile formalite gibi duruyor",
                createdAt: new Date("2026-08-05 08:22:00"),
                updatedAt: new Date()
            },

            {
                userId: 5,
                postId: 44,
                content: "Benimde temiz bi bisiklet var ama satmayı düşünmüyorum şimdilik. İkinci el sitelerine de bakabilirsin",
                createdAt: new Date("2026-08-06 15:35:00"),
                updatedAt: new Date()
            },
            {
                userId: 7,
                postId: 44,
                content: "Bende arıyorum, fiyatlar baya yükselmiş. Temiz bi bisiklet bulursan buraya yaz bende bakarım",
                createdAt: new Date("2026-08-07 08:48:00"),
                updatedAt: new Date()
            },

            {
                userId: 6,
                postId: 45,
                content: "Bölüme göre değişiyor ama derslere düzenli çalışırsan çoğu sınav geçilebilir. Son haftaya bırakınca zorlanıyosun",
                createdAt: new Date("2026-08-09 15:01:00"),
                updatedAt: new Date()
            },
            {
                userId: 8,
                postId: 45,
                content: "Bazı hocaların sınavları baya zor olabiliyor. Derste anlatılanları takip etmek yetmiyo bazen ekstra çalışmak gerekiyor",
                createdAt: new Date("2026-08-10 08:14:00"),
                updatedAt: new Date()
            },
            {
                userId: 4,
                postId: 45,
                content: "Benim bölümde sınavlar genelde orta seviyede. Çıkmış sorulara bakmak baya yardımcı oluyo",
                createdAt: new Date("2026-08-11 15:27:00"),
                updatedAt: new Date()
            },
            {
                userId: 9,
                postId: 45,
                content: "İlk sene biraz zorlanmıştım açıkcası üniversite sınavı gibi değil. Hocaların ne istediğini zamanla anlıyosun",
                createdAt: new Date("2026-08-13 08:40:00"),
                updatedAt: new Date()
            },
        ];

        await queryInterface.bulkInsert("post_replies", replies);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("post_replies", { postId: 1 }, {});
    }
};