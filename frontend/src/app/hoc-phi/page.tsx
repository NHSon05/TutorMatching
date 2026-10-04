"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";

export default function TuitionPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1D] relative pb-16 md:pb-0">
      <Header />

      {/* Breadcrumb Header */}
      <section className="bg-gradient-to-b from-[#fefaf2] to-[#f8f1e3] py-12 px-4 text-center border-b border-amber-100">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1D1D1D] mb-3">
            Học phí và hình thức học
          </h1>
          <p className="text-sm md:text-base text-[#475569] max-w-2xl mx-auto">
            Tham khảo học phí và lựa chọn hình thức học phù hợp với nhu cầu học tập của học sinh
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
              <p className="text-base text-gray-700 leading-relaxed italic bg-amber-50/50 p-4 rounded-xl border border-amber-200/50">
                Mỗi học sinh có khả năng tiếp thu và nhu cầu học tập khác nhau. Việc lựa chọn hình thức học phù hợp sẽ giúp nâng cao hiệu quả học tập và tối ưu chi phí.
              </p>

              {/* 1. Học phí gia sư tham khảo */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#FFB717] text-white font-bold flex items-center justify-center text-sm shadow">
                    1
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Học phí gia sư tham khảo
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  Dưới đây là mức học phí gia sư tại nhà tham khảo theo cấp học và đối tượng giảng dạy (đơn vị: VNĐ / buổi 2h). Học online thường có mức học phí linh hoạt và tối ưu hơn.
                </p>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm mt-4">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#fffbeb] text-gray-900 font-bold border-b border-gray-200 text-center">
                      <tr>
                        <th className="py-3.5 px-4 text-left">Cấp học</th>
                        <th className="py-3.5 px-4">Sinh viên</th>
                        <th className="py-3.5 px-4">Giáo viên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-center">
                      <tr className="hover:bg-amber-50/30">
                        <td className="py-3.5 px-4 text-left font-semibold text-gray-800">Tiểu học</td>
                        <td className="py-3.5 px-4 text-[#ca6f04] font-medium">130.000 - 160.000đ</td>
                        <td className="py-3.5 px-4 text-blue-700 font-medium">300.000 - 350.000đ</td>
                      </tr>
                      <tr className="hover:bg-amber-50/30">
                        <td className="py-3.5 px-4 text-left font-semibold text-gray-800">THCS (Lớp 6 - 9)</td>
                        <td className="py-3.5 px-4 text-[#ca6f04] font-medium">150.000 - 180.000đ</td>
                        <td className="py-3.5 px-4 text-blue-700 font-medium">350.000 - 400.000đ</td>
                      </tr>
                      <tr className="hover:bg-amber-50/30">
                        <td className="py-3.5 px-4 text-left font-semibold text-gray-800">THPT (Lớp 10 - 12)</td>
                        <td className="py-3.5 px-4 text-[#ca6f04] font-medium">160.000 - 200.000đ</td>
                        <td className="py-3.5 px-4 text-blue-700 font-medium">350.000 - 450.000đ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1.5 border border-gray-100">
                  <div className="font-bold text-gray-800 mb-1">Lưu ý:</div>
                  <p>• Học phí có thể thay đổi tùy môn học, số buổi học và nhu cầu cụ thể của học sinh.</p>
                  <p>• Học phí online thường linh hoạt hơn so với học tại nhà (tiết kiệm từ 15% - 25%).</p>
                  <p>• Với các chương trình nâng cao, quốc tế, luyện thi chuyên, ngoại ngữ hoặc môn đặc thù, học phí có thể khác mức tham khảo.</p>
                </div>
              </section>

              {/* 2. Nên chọn gia sư nào phù hợp? */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#1877F2] text-white font-bold flex items-center justify-center text-sm shadow">
                    2
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Nên chọn gia sư nào phù hợp?
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  Mỗi đối tượng giảng dạy sẽ phù hợp với từng nhu cầu học tập khác nhau. Tham khảo bảng dưới đây để lựa chọn gia sư phù hợp cho học sinh:
                </p>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm mt-4">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f0f9ff] text-gray-900 font-bold border-b border-gray-200 text-center">
                      <tr>
                        <th className="py-3.5 px-4 text-left">Tiêu chí</th>
                        <th className="py-3.5 px-4">
                          Sinh viên
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">
                            Phổ biến
                          </span>
                        </th>
                        <th className="py-3.5 px-4">
                          Giáo viên
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-normal">
                            Chuyên sâu
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                      <tr className="hover:bg-blue-50/20">
                        <td className="py-3 px-4 font-semibold text-gray-800">Học phí</td>
                        <td className="py-3 px-4 text-center">Tiết kiệm, phù hợp học lâu dài</td>
                        <td className="py-3 px-4 text-center">Cao hơn, phù hợp giai đoạn nước rút</td>
                      </tr>
                      <tr className="hover:bg-blue-50/20">
                        <td className="py-3 px-4 font-semibold text-gray-800">Phù hợp</td>
                        <td className="py-3 px-4">Học sinh cần củng cố kiến thức, dò bài, giải bài tập</td>
                        <td className="py-3 px-4">Luyện thi chuyển cấp, học sinh mất gốc nặng, thi chuyên</td>
                      </tr>
                      <tr className="hover:bg-blue-50/20">
                        <td className="py-3 px-4 font-semibold text-gray-800">Phong cách dạy</td>
                        <td className="py-3 px-4">Gần gũi, nắm bắt tâm lý, dễ chia sẻ như anh chị</td>
                        <td className="py-3 px-4">Sư phạm bài bản, kỷ luật cao, giàu kinh nghiệm đứng lớp</td>
                      </tr>
                      <tr className="hover:bg-blue-50/20">
                        <td className="py-3 px-4 font-semibold text-gray-800">Lộ trình học</td>
                        <td className="py-3 px-4">Bám sát sách giáo khoa và bài tập hàng ngày trên lớp</td>
                        <td className="py-3 px-4">Xây dựng lộ trình bài bản, chuyên sâu theo mục tiêu điểm số</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. Học gia sư tại nhà hay học online? */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#4CAF50] text-white font-bold flex items-center justify-center text-sm shadow">
                    3
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Học gia sư tại nhà hay học online?
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-[#fffcf7] border border-amber-200 rounded-2xl p-6 space-y-3">
                    <h3 className="text-lg font-bold text-[#b45309] flex items-center gap-2">
                      <i className="fa-solid fa-house"></i>
                      Gia sư tại nhà
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li>• <strong>Tương tác trực tiếp:</strong> Gia sư ngồi cạnh uốn nắn từng nét chữ, theo sát bài làm.</li>
                      <li>• <strong>Rèn kỷ luật:</strong> Tạo thói quen tập trung cao độ, hạn chế xao nhãng.</li>
                      <li>• <strong>Phù hợp nhất:</strong> Học sinh tiểu học, THCS cần người kèm cặp trực diện.</li>
                    </ul>
                  </div>

                  <div className="bg-[#f0fdf4] border border-green-200 rounded-2xl p-6 space-y-3">
                    <h3 className="text-lg font-bold text-[#047857] flex items-center gap-2">
                      <i className="fa-solid fa-laptop"></i>
                      Gia sư Online (1 kèm 1)
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li>• <strong>Linh hoạt thời gian:</strong> Dễ dàng sắp xếp lịch học mà không ngại thời tiết, di chuyển.</li>
                      <li>• <strong>Tiết kiệm chi phí:</strong> Tối ưu học phí hơn từ 15% - 25% so với học tại nhà.</li>
                      <li>• <strong>Phù hợp nhất:</strong> Học sinh THCS, THPT, ôn thi đại học hoặc học ngoại ngữ.</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-lg sticky top-24">
                <div className="flex items-center gap-2.5 text-[#ca6f04] mb-3">
                  <i className="fa fa-shield text-xl"></i>
                  <h3 className="text-base font-bold text-gray-900">
                    Đăng ký nhận tư vấn học phí
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-5">
                  GiasuHome sẽ liên hệ tư vấn mức học phí chi tiết và giới thiệu gia sư phù hợp nhất cho gia đình.
                </p>

                {submitted ? (
                  <div className="text-center py-6 bg-green-50 rounded-xl border border-green-200 p-4">
                    <i className="fa fa-check-circle text-green-500 text-3xl mb-2"></i>
                    <h4 className="text-sm font-bold text-green-900">Đăng ký thành công!</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Chúng tôi sẽ liên hệ tới số {phone} sớm nhất.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên phụ huynh *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="0[0-9]{9}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại liên hệ"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Lớp học của con *
                      </label>
                      <select
                        required
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-gray-700"
                      >
                        <option value="">Chọn lớp học</option>
                        <option value="TieuHoc">Tiểu học (Lớp 1 - 5)</option>
                        <option value="THCS">THCS (Lớp 6 - 9)</option>
                        <option value="THPT">THPT (Lớp 10 - 12)</option>
                        <option value="DaiHoc">Luyện thi ĐH / Ngoại ngữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Nhu cầu cụ thể (nếu có)
                      </label>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Môn học, mục tiêu điểm số..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white bg-[#FFB717] hover:bg-[#f59e0b] shadow-md transition-all text-sm"
                    >
                      Nhận tư vấn ngay
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fa fa-phone text-[#ca6f04]"></i>
                    <span>Hotline: <strong className="text-gray-800">0369 148 660</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa fa-clock text-[#ca6f04]"></i>
                    <span>Hỗ trợ tư vấn 24/7 cả thứ 7 & CN</span>
                  </div>
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
