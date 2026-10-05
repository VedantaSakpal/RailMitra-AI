Improve the RailMitra Tickets feature into a complete Mumbai Local ticket-booking flow.

1. SOURCE & DESTINATION
- User selects Source Station and Destination Station.
- Automatically calculate the actual railway distance between Source → Destination using the Mumbai suburban railway station-distance dataset already available in the project.
- Use the correct railway route/branch for Central, Western, Harbour, Trans-Harbour, etc.
- For multiple possible routes, use the valid railway route distance, NOT straight-line/geographical distance.
- Do not hardcode fares for individual station pairs.
- Show the calculated distance immediately after both stations are selected.

Example:
CSMT → Masjid ≈ 1 km
CSMT → Dombivli ≈ 50+ km

2. DYNAMIC FARE CALCULATION
Use these fare rules:

- 0–10 km → ₹5
- 11–25 km → ₹10
- 26 km and above → ₹15
- Return ticket → 2× one-way fare
- 1st Class → 10× applicable fare
- AC → 20× applicable fare

Calculate the final fare dynamically based on:
distance + journey type + class + passenger count.

Show:

Distance: XX km
Base Fare: ₹XX
Journey Type: One-way/Return
Class: 2nd/1st/AC
Passengers: X
Total Fare: ₹XX

Update the fare automatically whenever the source, destination, journey type, class, or passenger count changes.

3. PROCEED TO PAYMENT
When the user clicks "Proceed to Pay":
- Check authentication/access token correctly.
- Fix the current "Access token required" issue by sending the logged-in user's valid token to the booking/payment API.
- Validate all booking details on the backend.
- Open a payment/checkout page.

The checkout page should show:
- Source → Destination
- Distance
- Journey Type
- Class
- Passenger Count
- Total Fare

4. MOCK PAYMENT ONLY
This is a college/demo project. DO NOT integrate Razorpay, Stripe, real UPI APIs, banking APIs, or any real payment gateway.

Create a realistic MOCK/DEMO PAYMENT system.

Clearly display:
"DEMO PAYMENT – No real money will be charged"

Payment methods:
- UPI
- Credit/Debit Card
- Net Banking

UPI:
- Allow demo UPI ID such as demo@upi.

Card:
- Card holder name
- Mock card number
- Expiry
- CVV

IMPORTANT:
- Never process real payments.
- Never store real card numbers, CVV, UPI credentials, or banking information.
- Clearly mark all payment fields as DEMO/MOCK.
- Use fake/demo payment data only.

5. MOCK PAYMENT PROCESS
When user clicks "Pay ₹XX":
- Show "Processing Payment..." for approximately 1–2 seconds.
- Simulate payment result.
- Provide successful and failed payment states.

SUCCESS:
- Set payment_status = SUCCESS.
- Create a unique Ticket ID.
- Save booking/payment details in the database.
- Save booked_at timestamp.
- Save expires_at timestamp = booked_at + 24 hours.
- Redirect/show the generated ticket.

FAILURE:
- Do not create a valid ticket.
- Show "Payment Failed".
- Provide "Try Again".

6. GENERATED TICKET
After successful mock payment, show a professional RailMitra digital ticket containing:

- RailMitra logo/name
- Ticket ID
- Passenger name
- Source Station
- Destination Station
- Distance
- Journey Type
- Class
- Passenger Count
- Fare
- Payment Status
- Booking Date & Time
- Valid Until
- Ticket Status

Example:

Ticket ID: RM-XXXXXXXX
CSMT → Dombivli
Distance: 51.2 km
Journey: One-way
Class: 2nd
Passengers: 1
Fare: ₹15
Payment: SUCCESS
Booked: 25 Sep 2026, 10:30 PM
Valid Until: 26 Sep 2026, 10:30 PM
Status: VALID

7. 24-HOUR TICKET VALIDITY
- Ticket is valid for exactly 24 hours from successful payment/booking.
- Store booked_at and expires_at in the database.
- Backend must validate expiry.
- Do NOT rely only on frontend timers.
- Before expiry, show status "VALID".
- After 24 hours, automatically show "EXPIRED".
- Expired tickets cannot be used.
- Do not allow users to manually extend or modify expiry time.
- Ticket validity must be checked whenever the ticket is opened/used.

8. DATABASE
Create/update the required database structure for:
- bookings/tickets
- payment records

Store:
- ticket_id
- user_id
- source_station
- destination_station
- distance_km
- journey_type
- class
- passenger_count
- base_fare
- total_fare
- payment_status
- payment_method
- booked_at
- expires_at
- ticket_status

9. SECURITY
- Require authenticated users for booking.
- Validate the access token on the backend.
- Never trust fare, distance, payment status, or expiry values sent only from the frontend.
- Recalculate distance and fare on the backend using the station-distance dataset.
- Never allow the frontend to mark a payment as successful.
- Never allow users to modify ticket price, payment status, booked_at, or expires_at.
- Sanitize and validate all booking inputs.

10. UI/UX
Keep the existing RailMitra design and styling shown in the current Tickets page.

Improve the current page so that after selecting stations it dynamically displays:

Source
↓
Destination

Distance: XX km
Fare: ₹XX

Then:

[ Proceed to Pay ]

Create a clean payment modal/page and a professional digital ticket page consistent with RailMitra's existing UI.

11. IMPORTANT IMPLEMENTATION RULES
- Use the existing Mumbai Local station-distance data already added to the project.
- Support Central, Western, Harbour and Trans-Harbour routes and branches.
- Do not use straight-line distance.
- Do not hardcode individual station-pair fares.
- Fare must always be calculated from railway distance.
- Use the existing authentication system.
- Use the existing database/backend architecture.
- Do not break existing RailMitra features.
- Reuse existing components, APIs, styles and database conventions wherever possible.
- First inspect the existing codebase and understand the current Tickets, authentication, database and API implementation before making changes.
- Implement the complete flow end-to-end:

Station Selection
→ Distance Calculation
→ Dynamic Fare
→ Booking Validation
→ Mock Payment
→ Payment Success
→ Ticket Generation
→ 24-Hour Validity
→ Automatic Expiry

Finally, test the complete flow with examples such as:
CSMT → Masjid
CSMT → Dombivli
CSMT → Kalyan
Kalyan → Kasara
Kalyan → Khopoli
CSMT → Panvel

Make sure the calculated distance and fare are consistent with the Mumbai suburban railway route data.