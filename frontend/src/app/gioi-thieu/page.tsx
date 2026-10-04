"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";

export default function AboutPage() {
  const reviewsImages = [
    "https://giasuhome.vn/lib/image/phu_huynh1.png",
    "https://giasuhome.vn/lib/image/phu_huynh2.png",
    "https://giasuhome.vn/lib/image/phu_huynh3.png",
    "https://giasuhome.vn/lib/image/phu_huynh4.png",
    "https://giasuhome.vn/lib/image/phu_huynh5.png",
    "https://giasuhome.vn/lib/image/phu_huynh6.png",
    "https://giasuhome.vn/lib/image/phu_huynh7.png",
    "https://giasuhome.vn/lib/image/phu_huynh8.jpg",
    "https://giasuhome.vn/lib/image/phu_huynh9.png",
    "https://giasuhome.vn/lib/image/phu_huynh10.png",
    "https://giasuhome.vn/lib/image/phu_huynh11.png",
    "https://giasuhome.vn/lib/image/phu_huynh12.png",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1D] relative pb-16 md:pb-0">
      <Header />

      {/* Breadcrumb Header */}
      <section className="bg-gradient-to-b from-[#fefaf2] to-[#f8f1e3] py-12 px-4 text-center border-b border-amber-100">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1D1D1D] mb-3">
            Về chúng tôi
          </h1>
          <p className="text-sm md:text-base text-[#475569] max-w-2xl mx-auto">
            Nền tảng kết nối gia sư 1 kèm 1 phù hợp với từng học sinh
          </p>
        </div>
      </section>

      {/* 1. Giới thiệu tổng quan & Slogan */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container-custom max-w-5xl">
          <div className="bg-[#fffcf7] rounded-3xl p-8 md:p-12 border border-amber-200/80 shadow-md">
            <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                Chúng tôi hiểu rằng điều phụ huynh quan tâm không chỉ là tìm được một gia sư giỏi, mà còn là sự phù hợp và yên tâm trong suốt quá trình học tập của con.
              </p>
              <p>
                GiasuHome được xây dựng với mong muốn trở thành cầu nối giữa phụ huynh và những gia sư tận tâm, đáng tin cậy.
              </p>
              <p>
                Chúng tôi tập trung lắng nghe nhu cầu, tư vấn và kết nối gia sư phù hợp với từng học sinh. GiasuHome luôn sẵn sàng hỗ trợ khi gia đình cần điều chỉnh hoặc thay đổi gia sư.
              </p>
              <p className="pt-4 text-xl md:text-2xl font-bold text-[#ca6f04] border-t border-amber-200/60 mt-6">
                <span>&ldquo;Tận tâm kết nối&rdquo;</span> — giá trị mà GiasuHome luôn theo đuổi trong quá trình đồng hành cùng phụ huynh và gia sư.
              </p>
            </div>

            {/* 3 tính năng cốt lõi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-amber-200/60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#ca6f04] flex items-center justify-center text-xl shrink-0 shadow-sm">
                  <i className="fas fa-comments"></i>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">Thấu hiểu nhu cầu</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Lắng nghe và hỗ trợ phụ huynh trong suốt quá trình lựa chọn gia sư phù hợp.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1877F2] flex items-center justify-center text-xl shrink-0 shadow-sm">
                  <i className="fas fa-user-friends"></i>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">Kết nối phù hợp</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Kết nối gia sư dựa trên năng lực tiếp thu thực tế và mong muốn của gia đình.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#4CAF50] flex items-center justify-center text-xl shrink-0 shadow-sm">
                  <i className="fas fa-sync-alt"></i>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">Hỗ trợ linh hoạt</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Sẵn sàng hỗ trợ đổi gia sư miễn phí nếu chưa phù hợp sau buổi học thử.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Vì sao phụ huynh lựa chọn GiasuHome? */}
      <section className="py-14 bg-[#faf8f5] border-y border-amber-100/60">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2.5">
              Vì sao phụ huynh lựa chọn GiasuHome?
            </h2>
            <p className="text-sm text-gray-600">
              Không chỉ tìm gia sư, chúng tôi giúp phụ huynh yên tâm hơn trong quá trình lựa chọn
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ca6f04] flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-clock"></i>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Tiết kiệm thời gian</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Không cần tự đăng tin và liên hệ nhiều nơi. Chỉ cần chia sẻ nhu cầu, GiasuHome sẽ hỗ trợ tìm kiếm và kết nối phù hợp.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Ưu tiên sự phù hợp</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mỗi học sinh có năng lực và cách học khác nhau. Chúng tôi ưu tiên yếu tố phù hợp thay vì chỉ dựa vào thành tích trên giấy tờ.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#4CAF50] flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Minh bạch thông tin</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gia sư được xác minh CCCD, thẻ sinh viên/bằng cấp trước khi nhận lớp, giúp phụ huynh hoàn toàn an tâm.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#f44336] flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-heart"></i>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Hỗ trợ sau kết nối</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                GiasuHome luôn sẵn sàng hỗ trợ khi gia đình cần tư vấn, điều chỉnh lịch học hoặc thay đổi trong quá trình đồng hành.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Thư viện phản hồi từ phụ huynh */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2.5">
              Chia sẻ từ phụ huynh
            </h2>
            <p className="text-sm text-gray-600">
              Niềm tin của phụ huynh là động lực để GiasuHome không ngừng hoàn thiện dịch vụ
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {reviewsImages.map((src, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <img
                  src={src}
                  alt={`Phụ huynh nhận xét ${index + 1}`}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/#trial_section"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white bg-black hover:bg-zinc-800 shadow-lg text-sm transition-all"
            >
              Đăng ký học thử ngay
              <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWidgets />
    </div>
  );
}
