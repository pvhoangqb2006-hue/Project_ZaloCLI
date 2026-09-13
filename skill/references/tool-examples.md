# Ví dụ input/output của từng tool

## zalo_get_messages

**Input:**
```json
{ "threadId": "g1", "limit": 10 }
```

**Output (khi có tin nhắn):**
```json
{
  "messages": [
    { "fromId": "fake_user_999", "text": "Chào buổi sáng!", "type": "text", "threadId": "g1", "seq": 1, "receivedAt": "2026-09-13T14:04:24.309Z" },
    { "fromId": "fake_user_999", "text": "Ok, đã nhận", "type": "text", "threadId": "g1", "seq": 5, "receivedAt": "2026-09-13T14:04:24.908Z" }
  ],
  "nextCursor": "5",
  "hasMore": false
}
```

**Output (thread chưa từng có tin nhắn):**
```json
{ "messages": [], "nextCursor": null, "hasMore": false }
```

Lấy tin mới hơn ở lần gọi sau bằng cách truyền `cursor` = giá trị `nextCursor` vừa nhận:
```json
{ "threadId": "g1", "limit": 10, "cursor": "5" }
```

## zalo_send_message

**Input:**
```json
{ "threadId": "g1", "text": "AI trả lời tự động", "isGroup": true }
```

**Output:**
```json
{ "sent": true, "threadId": "g1", "isGroup": true, "preview": "AI trả lời tự động" }
```
