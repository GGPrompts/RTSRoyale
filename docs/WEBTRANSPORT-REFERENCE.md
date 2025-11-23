# WebTransport API Reference

## Documentation Source
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API

## Why WebTransport for RTS Arena

### Advantages Over WebSocket
- **5-15ms latency improvement** (as noted in plan)
- No head-of-line blocking (QUIC protocol)
- Faster connection establishment
- Better handling of packet loss
- Seamless network switching (WiFi ↔ cellular)

### Browser Support
**Limited availability** - not yet baseline. Use as enhancement with WebSocket fallback:
- Chrome/Edge: ✅ Supported
- Firefox: ⚠️ Limited
- Safari: ❌ Not yet

**Recommendation**: Implement WebSocket first, add WebTransport as Phase 3+ optimization.

## Basic Usage

### Connection
```typescript
// Establish connection (requires HTTPS + specific port)
const transport = new WebTransport("https://game-server.com:4999/match");
await transport.ready;

// Handle closure
transport.closed.then(() => {
  console.log('Connection closed');
});
```

### Unreliable Datagrams (for input)
Perfect for player input where latest state matters most:
```typescript
// Send input
const writer = transport.datagrams.writable.getWriter();
const inputData = new Uint8Array([/* move command, x, y */]);
await writer.write(inputData);

// Receive updates
const reader = transport.datagrams.readable.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  // Process game state update
}
```

### Reliable Streams (for game state)
Use for critical data like match results, tournament progression:
```typescript
// Send critical data
const stream = await transport.createUnidirectionalStream();
const writer = stream.writable.getWriter();
await writer.write(encoder.encode(JSON.stringify(matchResult)));
await writer.close();

// Receive server updates
const streams = transport.incomingUnidirectionalStreams;
const reader = streams.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const streamReader = value.getReader();
  // Read stream data...
}
```

### Bidirectional Streams
For request-response patterns:
```typescript
const stream = await transport.createBidirectionalStream();

// Send request
const writer = stream.writable.getWriter();
await writer.write(requestData);

// Read response
const reader = stream.readable.getReader();
const { value } = await reader.read();
```

## Implementation Strategy for RTS Arena

### Phase 3: Networking Foundation
1. **Start with WebSocket** - Universal support
2. **Build abstraction layer** - Easy to swap transports
3. **Add WebTransport detection** - Use when available
4. **Measure improvement** - Log latency differences

### Recommended Transport Interface
```typescript
interface GameTransport {
  connect(url: string): Promise<void>;
  sendInput(data: Uint8Array): void;
  sendReliable(data: Uint8Array): Promise<void>;
  onStateUpdate(callback: (data: Uint8Array) => void): void;
  close(): void;
}

// Implementations: WebSocketTransport, WebTransportAdapter
```

## Performance Targets
- <50ms perceived latency (same region)
- <5KB/s bandwidth per player
- Graceful handling of 300ms spikes
- 0% desync rate
