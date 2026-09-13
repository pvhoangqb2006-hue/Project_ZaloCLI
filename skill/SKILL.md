---
name: zalo-agent
description: Đọc, theo dõi, và trả lời tin nhắn Zalo (cá nhân hoặc nhóm) qua bộ MCP tool zalo_get_messages / zalo_send_message. Dùng skill này bất cứ khi nào người dùng nhắc tới "Zalo" kèm các yêu cầu như đọc tin nhắn, kiểm tra tin chưa đọc, theo dõi hội thoại, trả lời tự động, hoặc gửi tin nhắn tới ai đó/nhóm nào đó trên Zalo.
---

# Zalo Agent Skill

Skill này hướng dẫn cách dùng đúng 2 tool MCP chính để tương tác với Zalo: `zalo_get_messages` (đọc tin nhắn) và `zalo_send_message` (gửi tin nhắn).

## Khái niệm cần nắm trước khi dùng

**threadId** — id của 1 cuộc trò chuyện, có thể là id cá nhân hoặc id nhóm. Không tự suy đoán hay bịa threadId; nếu người dùng chưa cung cấp, hỏi lại rõ ràng.

**Tin nhắn đã được lọc nhiễu sẵn** — `zalo_get_messages` sẽ KHÔNG bao giờ trả về sticker, emoji đơn lẻ (vd "😂"), hay tin thông báo hệ thống (đổi tên nhóm, thu hồi tin nhắn...). Nếu kết quả trả về rỗng dù cuộc trò chuyện đang có hoạt động, nhiều khả năng toàn bộ tin gần nhất chỉ là loại bị lọc — đây không phải lỗi, không cần báo cho người dùng là "tool bị hỏng".

**Cursor phân trang** — lần gọi `zalo_get_messages` đầu tiên trong 1 phiên làm việc thì bỏ trống `cursor`. Nếu cần đọc tiếp các tin mới hơn ở lần gọi sau (cùng 1 threadId, trong cùng phiên hội thoại), dùng đúng giá trị `nextCursor` nhận được từ lần gọi trước — không tự đặt lại `cursor` về trống nếu mục đích là lấy tin mới, vì sẽ đọc lại tin cũ đã xử lý rồi.

## Quy trình điển hình

**Kiểm tra tin nhắn mới trong 1 hội thoại:**
1. Gọi `zalo_get_messages` với `threadId` tương ứng
2. Nếu `messages` rỗng → báo người dùng không có tin nhắn mới (hoặc chỉ có tin loại bị lọc)
3. Nếu có tin nhắn → đọc nội dung, tóm tắt hoặc trả lời theo đúng yêu cầu người dùng

**Trả lời tự động 1 câu hỏi trong nhóm:**
1. Gọi `zalo_get_messages` để lấy tin nhắn gần nhất
2. Xác định có tin nhắn nào cần phản hồi không (dựa vào ngữ cảnh, không tự suy diễn nếu không rõ)
3. Nếu cần trả lời, gọi `zalo_send_message` với `threadId` đúng và `isGroup: true`
4. Không gọi `zalo_send_message` lặp lại nhiều lần cho cùng 1 câu hỏi — mỗi lần gọi là gửi thật ngay lập tức, không có bước xác nhận hay hoàn tác

**Gửi tin nhắn theo yêu cầu trực tiếp:**
1. Xác nhận rõ người nhận (threadId) và nội dung trước khi gọi `zalo_send_message`
2. Đặt `isGroup: true` nếu gửi vào nhóm, `false` (mặc định) nếu gửi cá nhân — gửi sai `isGroup` có thể khiến tin nhắn đi nhầm chỗ

## Lưu ý an toàn khi gửi tin nhắn

`zalo_send_message` gửi tin nhắn thật ngay khi được gọi, không có bước xác nhận lại. Nếu nội dung tin nhắn có tính nhạy cảm (xin lỗi, từ chối, thông tin quan trọng...) hoặc người dùng không nêu rõ nội dung chính xác, nên hỏi lại để xác nhận nội dung trước khi gửi, thay vì tự soạn rồi gửi luôn.

## Tool không dùng trong thực tế

`dev_seed_message` chỉ tồn tại để lập trình viên test ThreadFilter/MessageBuffer khi phát triển — **không gọi tool này** khi hỗ trợ người dùng thật, vì nó tạo tin nhắn giả, không phản ánh dữ liệu Zalo thật.

## Ví dụ input/output cụ thể

Xem `references/tool-examples.md` để biết định dạng JSON chính xác của từng tool.
