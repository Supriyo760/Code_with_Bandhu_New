# Code With Bandhu

> **Bandhu** (बंधु) means "friend" or "companion" in Hindi. Because coding is always better with a friend! 

Ever tried explaining your code to someone over a call while frantically scrolling through screen shares? Or attempted to debug with a teammate while juggling between Zoom, VS Code, and a dozen chat windows? Yeah, we've been there too. That's why we built **Code With Bandhu** – your all-in-one collaborative coding companion.

<div align="center">

## [Try Live Demo](https://code-with-bandhu-new.vercel.app)

## Screenshots
<img width="1918" height="858" alt="Screenshot 2025-12-10 150600" src="https://github.com/user-attachments/assets/c3dad814-1750-4ca0-a60e-9e6bef4b84e9" />
<img width="1918" height="863" alt="Screenshot 2025-12-10 151119" src="https://github.com/user-attachments/assets/4028c7ca-2b08-4b61-8496-2fb8d006de4f" />
<img width="1917" height="597" alt="Screenshot 2025-12-10 151333" src="https://github.com/user-attachments/assets/4077241d-9987-4a11-8c5d-0a6de3dfee9e" />

</div>

## What's This All About?

**Code With Bandhu** is a real-time collaborative code editor that brings everything you need into one place. Think Google Docs, but for code, with video calls, chat, and the ability to run your programs instantly. Whether you're:
- Pair programming with a teammate across the globe
- Teaching coding to students
- Conducting technical interviews
- Debugging together in real-time

...we've got you covered!

## What Makes It Special?

### Real-Time Everything
Type a line of code, and boom – your teammate sees it instantly. No refresh, no delays, just pure synchronized magic. It's like you're sitting next to each other, but you could be continents apart.

### Face-to-Face Coding
Built-in video and audio calls mean you can actually *see* your coding buddy while you work. Forget alt-tabbing between apps – your video chat lives right in the editor. React to bugs together in real-time!

### Instant Code Execution
Write Python, JavaScript, Java, C++, or any of the 40+ supported languages, hit "Run," and watch your code execute in seconds. No need to install compilers or set up environments. We handle all that behind the scenes using the powerful Judge0 API.

### Chat Without Switching Tabs
Quick question? Share a Stack Overflow link? Drop a code snippet? Our integrated chat keeps your conversations flowing without breaking your focus.

### Custom Input Support
Need to test your code with different inputs? Our synchronized stdin field lets everyone in the room provide and modify test inputs together. Perfect for debugging those tricky edge cases.

### Fun Avatars
Because why not? Every user gets a unique, auto-generated avatar. It's the little things that make collaboration fun!

## Built With Modern Tech

We've carefully selected technologies that are rock-solid, performant, and loved by developers worldwide:

### Frontend Stack
- **React** – The UI library everyone loves
- **TypeScript** – Because we like our bugs caught at compile time
- **Vite** – Lightning-fast builds and hot module replacement
- **Tailwind CSS** – Utility-first styling that just works
- **Socket.IO** – Real-time bidirectional event-based communication
- **WebRTC** – Peer-to-peer video and audio streaming

### Backend Stack
- **Node.js + Express** – Fast, scalable JavaScript on the server
- **Socket.IO** – Keeping everyone in sync, in real-time
- **MongoDB + Mongoose** – Flexible data storage for rooms and sessions
- **Judge0 API** – The powerhouse behind our code execution

## Use Cases

**For Teams:**
"Hey, can you help me debug this function?" becomes a 30-second fix instead of a 30-minute screen-sharing session.

**For Educators:**
Teach coding live with students. See their code in real-time, guide them, and run examples together. No more "It works on my machine!" excuses.

**For Interviewers:**
Conduct technical interviews that feel natural. Watch candidates think, code, and solve problems in real-time while discussing their approach face-to-face.

**For Friends:**
Build a weekend project together, even if you're in different time zones. It's like a virtual coding café!

## Getting Started

Ready to dive in? Here's how to get Code With Bandhu running on your machine in just a few minutes.

### What You'll Need
- **Node.js** (v14 or higher) – [Download here](https://nodejs.org/)
- **npm or yarn** – Comes with Node.js
- **MongoDB** – Either install locally or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available!)
- **Judge0 API Key** – Grab a free one from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)

### 1. Clone the Project
```bash
git clone https://github.com/Supriyo760/Code_With_Bandhu.git
cd Code_With_Bandhu
```

### 2. Set Up the Backend
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
CLIENT_URL=http://localhost:5173
RAPIDAPI_KEY=your_judge0_api_key_here
```

Fire up the server:
```bash
npm run dev
```
Your server should be humming along at `http://localhost:5000`

### 3. Set Up the Frontend
Open a new terminal window:
```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```
Head over to `http://localhost:5173` and you're live!

## How to Use

### Creating Your First Room
1. Open the app at `http://localhost:5173`
2. Enter a cool room name (like "Debugging Party")
3. Add your username
4. Hit "Create Room"
5. Grab your **Room ID** from the top bar

### Inviting Your Coding Buddy
Share the Room ID with anyone you want to collaborate with. They just:
1. Click "Join Room" on the home page
2. Paste your Room ID
3. Enter their username
4. Click "Join"

And just like that, you're coding together!

### Working Together
- **Code Editor:** Start typing! Everyone sees changes instantly
- **Run Code:** Click the "Run" button to execute your code
- **Input Tab:** Add test inputs (stdin) for your program
- **Video Call:** Click the camera icon to start a video call
- **Chat:** Open the chat panel to send messages
- **Language:** Switch between 40+ programming languages with the dropdown

## Troubleshooting

**"Not connected to server" error?**
- Make sure your backend is running on port 5000
- Check that `VITE_API_URL` in client `.env` matches your server URL
- Verify MongoDB is running and the connection string is correct

**Video not working?**
- Allow camera/microphone permissions in your browser
- Check that you're using HTTPS (or localhost) – WebRTC requires secure contexts
- Try a different browser (Chrome and Firefox work best)

**Code execution failing?**
- Verify your Judge0 API key is valid
- Check RapidAPI quota limits (free tier has daily limits)
- Ensure `RAPIDAPI_KEY` is set in server `.env`

## Roadmap

We're just getting started! Here's what we're cooking up:

- [ ] **Code Execution History** – Save and revisit previous runs
- [ ] **Themes** – Dark mode, light mode, and custom themes
- [ ] **File Explorer** – Work with multiple files in a project
- [ ] **Authentication** – User accounts and private rooms
- [ ] **Mobile Support** – Code on the go
- [ ] **AI Assistant** – Inline code suggestions and debugging help
- [ ] **Internationalization** – Support for multiple languages
- [ ] **Analytics Dashboard** – Track usage and collaboration patterns

Got an idea? Open an issue or drop us a PR!

## Want to Contribute?

We'd love your help making Code With Bandhu even better! Whether you're fixing bugs, adding features, or improving docs, every contribution counts.

### Here's how:
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Ideas
- Find and fix bugs
- Add new features
- Improve documentation
- Enhance UI/UX
- Write tests
- Add translations

Check out our [Issues](https://github.com/Supriyo760/Code_With_Bandhu/issues) page for ideas!

## License

This project is open-source and available under the [MIT License](LICENSE). Feel free to use it, modify it, and share it!

## Acknowledgements

- **Judge0** for the amazing code execution API
- **Socket.IO** for making real-time web magic possible
- **WebRTC** community for peer-to-peer communication specs
- The entire **open-source community** for endless inspiration

## Questions or Feedback?

Found a bug? Have a feature request? Just want to say hi?
- [Open an issue](https://github.com/Supriyo760/Code_With_Bandhu/issues)
- Start a [discussion](https://github.com/Supriyo760/Code_With_Bandhu/discussions)
- Email: [your-email@example.com](mailto:your-email@example.com)

---

<div align="center">

Made with love and lots of coffee by [Supriyo](https://github.com/Supriyo760)

**If this project helped you, consider giving it a star – it really makes our day!**

[Back to Top](#code-with-bandhu)

</div>

