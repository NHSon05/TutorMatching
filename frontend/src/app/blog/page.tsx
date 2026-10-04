"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";

interface BlogPost {
  id: number;
  title: string;
  topic: string;
  date: string;
  image: string;
  excerpt: string;
}

const allBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "5 dấu hiệu con đang cần gia sư hỗ trợ sớm",
    topic: "dau-hieu",
    date: "Thứ Ba, 01/10/2024",
    image: "https://giasuhome.vn/lib/image/blog_1.jpg",
    excerpt:
      "Con vẫn đi học đều, vẫn làm bài đầy đủ nhưng kết quả ngày càng giảm. Đó có thể là lời 'cầu cứu' mà con chưa biết cách nói ra...",
  },
  {
    id: 2,
    title: "Khi nào phụ huynh nên tìm gia sư cho con?",
    topic: "kinh-nghiem",
    date: "Thứ Bảy, 02/12/2024",
    image: "https://giasuhome.vn/lib/image/blog_7.jpg",
    excerpt:
      "Không phải đến khi con học kém mới cần gia sư. Chọn đúng thời điểm sẽ giúp con học nhẹ nhàng và tiến bộ hơn...",
  },
  {
    id: 3,
    title: "Gia sư sinh viên hay giáo viên: Nên chọn ai?",
    topic: "kinh-nghiem",
    date: "Thứ Tư, 06/11/2024",
    image: "https://giasuhome.vn/lib/image/blog_8.jpg",
    excerpt:
      "Mỗi lựa chọn đều có những ưu điểm riêng. Hiểu rõ nhu cầu học tập của con sẽ giúp phụ huynh đưa ra quyết định phù hợp hơn...",
  },
  {
    id: 4,
    title: "Học online hay học tại nhà hiệu quả hơn?",
    topic: "giai-phap",
    date: "Thứ Ba, 12/11/2024",
    image: "https://giasuhome.vn/lib/image/blog_9.jpg",
    excerpt:
      "Cả hai hình thức học đều có những lợi thế riêng. Chọn đúng cách sẽ giúp con tiếp thu hiệu quả và duy trì hứng thú học tập...",
  },
  {
    id: 5,
    title: "Con học chăm nhưng không tiến bộ: Vì sao?",
    topic: "dau-hieu",
    date: "Thứ Tư, 09/10/2024",
    image: "https://giasuhome.vn/lib/image/blog_2.jpg",
    excerpt:
      "Chăm chỉ là điều cần thiết, nhưng chưa chắc đã đủ. Nhiều học sinh tiến bộ chậm vì những nguyên nhân ít ai để ý...",
  },
  {
    id: 6,
    title: "Làm sao giúp con tập trung hơn khi học?",
    topic: "giai-phap",
    date: "Thứ Ba, 26/11/2024",
    image: "https://giasuhome.vn/lib/image/blog_13.png",
    excerpt:
      "Khả năng tập trung không phải do bẩm sinh. Chỉ cần đúng phương pháp, học sinh hoàn toàn có thể cải thiện từng ngày...",
  },
  {
    id: 7,
    title: "5 tiêu chí chọn gia sư phù hợp cho con",
    topic: "kinh-nghiem",
    date: "Thứ Sáu, 15/11/2024",
    image: "https://giasuhome.vn/lib/image/blog_10.png",
    excerpt:
      "Không phải gia sư giỏi nào cũng phù hợp với con. Hiểu rõ những tiêu chí quan trọng sẽ giúp phụ huynh lựa chọn đúng hơn...",
  },
  {
    id: 8,
    title: "7 dấu hiệu con đang bị mất gốc nhưng khó nhận ra",
    topic: "dau-hieu",
    date: "Thứ Năm, 24/10/2024",
    image: "https://giasuhome.vn/lib/image/blog_4.png",
    excerpt:
      "Mất gốc không xảy ra chỉ sau một kỳ học. Có những dấu hiệu xuất hiện rất sớm nhưng nhiều phụ huynh thường vô tình bỏ qua...",
  },
];

export default function BlogPage() {
  const [activeTopic, setActiveTopic] = useState("all");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  const filteredPosts = useMemo(() => {
    if (activeTopic === "all") return allBlogPosts;
    return allBlogPosts.filter((post) => post.topic === activeTopic);
  }, [activeTopic]);

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1D] relative pb-16 md:pb-0">
      <Header />

      {/* Breadcrumb Header */}
      <section className="bg-gradient-to-b from-[#fefaf2] to-[#f8f1e3] py-12 px-4 text-center border-b border-amber-100">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1D1D1D] mb-3">
            Blog chia sẻ kinh nghiệm
          </h1>
          <p className="text-sm md:text-base text-[#475569] max-w-2xl mx-auto">
            Chia sẻ kinh nghiệm, phương pháp học và giải pháp phù hợp cho học sinh mỗi ngày
          </p>
        </div>
      </section>

      {/* Main Blog Container */}
      <div className="py-12 bg-white flex-1">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (8 cols): Topics + Posts Grid */}
            <div className="lg:col-span-8 space-y-8">
              {/* Topic Filters */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Chủ đề được phụ huynh quan tâm
                </h2>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setActiveTopic("all")}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      activeTopic === "all"
                        ? "bg-[#ca6f04] text-white border-[#ca6f04] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    <span>🔍</span> Tất cả bài viết
                  </button>
                  <button
                    onClick={() => setActiveTopic("dau-hieu")}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      activeTopic === "dau-hieu"
                        ? "bg-[#ca6f04] text-white border-[#ca6f04] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    <span>📘</span> Dấu hiệu con cần hỗ trợ
                  </button>
                  <button
                    onClick={() => setActiveTopic("kinh-nghiem")}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      activeTopic === "kinh-nghiem"
                        ? "bg-[#ca6f04] text-white border-[#ca6f04] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    <span>🎯</span> Kinh nghiệm chọn gia sư
                  </button>
                  <button
                    onClick={() => setActiveTopic("giai-phap")}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      activeTopic === "giai-phap"
                        ? "bg-[#ca6f04] text-white border-[#ca6f04] shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                    }`}
                  >
                    <span>💡</span> Giải pháp học tập hiệu quả
                  </button>
                </div>
              </div>

              {/* Posts Grid */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Bài viết nổi bật ({filteredPosts.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1"
                    >
                      <div className="h-44 overflow-hidden relative bg-gray-100">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
                          <i className="fa-regular fa-clock"></i>
                          <span>{post.date}</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#ca6f04] transition-colors cursor-pointer leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4 flex-1">
                          {post.excerpt}
                        </p>
                        <span className="text-xs font-semibold text-[#ca6f04] group-hover:underline inline-flex items-center gap-1 mt-auto">
                          Đọc tiếp <i className="fa fa-arrow-right text-[10px]"></i>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Sticky Quick Consult Form */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#fffcf7] rounded-3xl p-6 border border-amber-200 shadow-lg sticky top-24">
                <div className="text-center mb-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Tìm gia sư phù hợp cho con
                  </h3>
                  <p className="text-xs text-gray-500">
                    Để lại thông tin, GiasuHome sẽ tư vấn gia sư phù hợp với nhu cầu học tập của con
                  </p>
                </div>

                {consultSubmitted ? (
                  <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-200 p-4">
                    <i className="fa fa-check-circle text-green-500 text-3xl mb-2"></i>
                    <h4 className="text-sm font-bold text-green-900">Đã gửi thông tin!</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Chuyên viên sẽ liên hệ tới số {phone} trong thời gian sớm nhất.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleConsultSubmit} className="space-y-3.5">
                    <div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên phụ huynh *"
                        className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        pattern="0[0-9]{9}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại *"
                        className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white bg-[#FFB717] hover:bg-[#f59e0b] shadow-md transition-all text-xs md:text-sm"
                    >
                      Nhận tư vấn miễn phí
                    </button>
                  </form>
                )}

                <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center justify-center gap-2 text-xs text-gray-500 text-center">
                  <i className="fa fa-shield text-[#ca6f04]"></i>
                  <span>Thông tin được bảo mật và chỉ dùng để tư vấn.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingWidgets />
    </div>
  );
}
