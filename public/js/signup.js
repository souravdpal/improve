const signupForm = document.getElementById('signupForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const questions = document.querySelectorAll('.question');
const progress = document.getElementById('progress');
let currentIndex = 0;
let data = {};
console.warn("you should never share the console details via signup!")

function updateQuestion() {
    questions.forEach((q, index) => {
        q.classList.toggle('active', index === currentIndex);
    });
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === questions.length - 1 ? 'Submit' : 'Next';
    progress.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
}

nextBtn.addEventListener('click', () => {
    const currentQuestion = questions[currentIndex];
    const input = currentQuestion.querySelector('input, select, textarea');
    if (input.hasAttribute('required') && !input.value) {
        alert('Please fill out this required field.');
        return;
    }
    if (currentIndex === questions.length - 1) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }
        const formData = new FormData(signupForm);
        data = {
            name: formData.get('name') || null,
            username: formData.get('username') || null,
            email: formData.get('email') || null,
            age: formData.get('age') || null,
            preferredName: formData.get('preferredName') || null,
            gender: formData.get('gender') || null,
            majors: formData.get('majors') || null,
            hobbies: formData.get('hobbies') || null,
            habits: formData.get('habits') || null,
            routine: formData.get('routine') || null,
            whyHere: formData.get('whyHere') || null,
            goalsChallenges: formData.get('goalsChallenges') || null,
            biggestChallenge: formData.get('biggestChallenge') || null,
            motivation: formData.get('motivation') || null,
            supportMethod: formData.get('supportMethod') || null,
            password: formData.get('password') || null
        };
        //console.log('Collected Data:', data);
        //alert('Sign-up successful! Redirecting to home page...');
        let send_data = async () => {
            alert(data.name)
            let regdata = {
                name: data.name,
                user: data.username,
                password: data.password,
                email: data.email,
                age: data.age,
                petname: data.preferredName,
                gender: data.gender,
                major: data.majors,
                hobbies: data.hobbies,
                habits: data.habits,
                routine: data.routine,
                why: data.whyHere,
                goals: data.goals,
                challange: data.biggestChallenge,
                motivation: data.motivation,
                support: data.supportMethod
            }
            fetch('/data/reg', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"


                },
                body: JSON.stringify(regdata)





            })
                .then(res => {
                    let msg = res.json()
                    if (res.ok) {
                        console.warn("you should never share the console details via signup!")
                        alert("succesfully registerd!")
                        localStorage.setItem('username', data.username)
                        localStorage.setItem('name', data.name)
                        window.location.href = `/home/hi/${encodeURIComponent(data.name)}`;
                    } else {
                        alert("user already exist!")
                        console.warn("user already exist!")
                    }
                })

        }
        send_data()


    } else {
        currentIndex++;
        updateQuestion();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateQuestion();
    }
});

updateQuestion();