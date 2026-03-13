# sms-segment-calculator

A small TypeScript utility to calculate the number of SMS segments for a given message.

I built this while working on a B2B SMS gateway. I assumed 1 message = 1 SMS. Turns out, it's way more nuanced than that.

---

## The problem

SMS billing is based on **segments**, not messages. And the number of segments depends on the encoding:

| Encoding | Single SMS | Multipart |
|----------|-----------|-----------|
| GSM 7-bit | 160 chars | 153 chars/segment |
| Unicode (UCS-2) | 70 chars | 67 chars/segment |

The tricky part: the moment one character in your message is outside the GSM 7-bit charset, the **entire message** switches to Unicode — and your limit drops from 160 to 70.

So an 80-character message with a single emoji 😀 = **2 segments**.

A few things that caught me off guard:
- `é`, `è`, `à` → GSM ✅ — but `ê`, `î`, `ô` → **not GSM** ❌, forces Unicode
- `€` → GSM extended ✅ — but counts as **2 GSM units**, not 1
- Emojis → always Unicode ❌

---

## Usage

```typescript
// Check encoding
console.log(estUnicode("Bonjour"))    // false — é, è, à are GSM
console.log(estUnicode("fête"))       // true  — ê is not GSM
console.log(estUnicode("Hello 😀"))   // true  — emoji forces Unicode

// Count segments
console.log(calculerSegments("Hello World!"))          // 1
console.log(calculerSegments("Hello 😀"))              // 1 (short unicode)
console.log(calculerSegments("Hello 😀".repeat(10)))   // 2+ segments
console.log(calculerSegments("Coût : 10€"))            // watch out — € = 2 GSM units
```

---

## Run it

```bash
npx ts-node --skip-project src/index.ts
```

---

## License

MIT
