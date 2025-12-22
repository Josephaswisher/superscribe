
export const generateMockPatients = (count: number = 10): string => {
    const firstNames = ['James', 'Mary', 'Kenneth', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

    const problems = ['HTN', 'T2DM', 'HLD', 'COPD', 'CHF', 'AFib', 'CKD', 'Asthma', 'Gerd', 'Obesity', 'Depression', 'Anxiety'];
    const admissionReasons = ['Chest Pain', 'SOB', 'Abdominal Pain', 'AMS', 'Syncope', 'Fall', 'Fever', 'Sepsis', 'Pneumonia', 'UTI'];

    let content = '';

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;

        const room = Math.floor(Math.random() * 500) + 100;
        const age = Math.floor(Math.random() * 60) + 20;
        const gender = Math.random() > 0.5 ? 'M' : 'F';
        const reason = admissionReasons[Math.floor(Math.random() * admissionReasons.length)];

        // Vitals
        const bpSystolic = Math.floor(Math.random() * 40) + 100;
        const bpDiastolic = Math.floor(Math.random() * 20) + 60;
        const hr = Math.floor(Math.random() * 40) + 60;
        const rr = Math.floor(Math.random() * 8) + 12;
        const spo2 = Math.floor(Math.random() * 5) + 95;
        const temp = (Math.random() * 1.5 + 36.5).toFixed(1);

        // Problems
        const patientProblems = [];
        const numProblems = Math.floor(Math.random() * 4) + 1;
        for (let j = 0; j < numProblems; j++) {
            patientProblems.push(problems[Math.floor(Math.random() * problems.length)]);
        }
        const uniqueProblems = [...new Set(patientProblems)];

        content += `\n### ${name} - ${room}\n`;
        content += `**${age}yo ${gender}** admitted for **${reason}**\n\n`;
        content += `VS: BP: ${bpSystolic}/${bpDiastolic} HR: ${hr} RR: ${rr} SpO2: ${spo2}% T: ${temp}°C\n\n`;
        content += `# Assessment & Plan\n`;
        uniqueProblems.forEach(p => {
            content += `## ${p}\n`;
            content += `- Monitor and treat\n`;
        });
        content += `\n`;
        content += `- [ ] Complete admission orders\n`;
        content += `- [ ] Consult Specialist if needed\n`;
        content += `\n`;
    }

    return content;
};
