# Bargaining lives inside Conversation, not as its own aggregate

`BargainOffer` is modeled as a child entity of the `Conversation` aggregate — a structured message type — rather than as an independently addressable `Bargain` aggregate. The product decision that bargaining happens "embedded in the shop's chat thread" signals offers are a specialization of `Message` within one `Conversation`'s consistency boundary, not a separate domain concept. Keeping them together avoids splitting one negotiation's state across two aggregates.
