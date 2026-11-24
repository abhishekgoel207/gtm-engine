# GTM Engine: business case

## Problem
Sales reps at small B2B companies research buyers, write outreach and update a CRM in separate tools. Much of that work happens between meetings, on a phone. AI tools can write more messages, but reps can't easily check their facts or control what is sent.

## Customer
- **User:** a non-technical sales rep or founder who sells.
- **Buyer:** a founder or head of sales at a B2B company with a small sales team.

## Product
A rep describes the product, approves an ideal customer, gets cited buyers, approves each message and tracks the pipeline.

## Why it is different
1. **Every fact has a source.** Uncited data is dropped, not shown.
2. **Nothing is sent without a rep's approval.** The server enforces it.
3. **A graph finds the reason to reach out:** warm introductions, active evaluations and competitor renewals.
4. **It says who not to contact,** and why.
5. **Phone first,** in plain words.

## Business model
Usage-based credits, so price follows value. Proposed, not yet tested with customers:

| Event | Credits |
| --- | --- |
| Buyer enriched | 5 |
| Message sent | 1 |
| Graph query | 0.2 |

Each workspace starts with 500 credits. Cost per lead and per meeting is shown to the customer. The price of a credit is still to be set.

## First market
Small B2B software companies that sell to mid-market IT. They have few reps, a clear buyer and public buying signals such as job posts. The demo uses a fictional one, PulseDesk.

## What we still need to prove
- Reps approve most drafts with few edits.
- Cited, signal-based messages get more replies than a rep's current ones.
- Customers will pay per credit.

First test: five design partners for four weeks, measuring approval rate, reply rate and time per lead.

## Risks
| Risk | Response |
| --- | --- |
| AI states something false | Facts must match a fetched source; a person approves |
| Spam and deliverability | No bulk approval, daily limits, email checks |
| Vendor changes or outages | Every vendor sits behind an adapter |
| Privacy | Business contacts only; outbound messages are checked |

## Deck outline (4 slides)
1. **Problem:** too many tools, too little trust in AI outreach.
2. **Product:** the five steps, shown on a phone.
3. **Why we win:** citations, approval gate, graph, agents that wait for a person.
4. **Business:** customer, credits, what we will prove next.
