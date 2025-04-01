-- Insert Networking MCQ Assessment
INSERT INTO assessments (title, description, "type", questions, "timeLimit", "createdAt")
VALUES (
  'Networking Fundamentals MCQ',
  'Test your knowledge of basic networking concepts with these multiple-choice questions.',
  'mcq',
  '[
    {
      "id": "net-mcq-1",
      "text": "Which layer of the OSI model is responsible for routing and forwarding data packets?",
      "timeLimit": 45,
      "options": [
        {"id": "opt1", "text": "Physical Layer"},
        {"id": "opt2", "text": "Data Link Layer"},
        {"id": "opt3", "text": "Network Layer"},
        {"id": "opt4", "text": "Transport Layer"}
      ],
      "correctOptionId": "opt3"
    },
    {
      "id": "net-mcq-2",
      "text": "Which protocol is used to convert IP addresses to MAC addresses?",
      "timeLimit": 30,
      "options": [
        {"id": "opt1", "text": "DHCP"},
        {"id": "opt2", "text": "ARP"},
        {"id": "opt3", "text": "ICMP"},
        {"id": "opt4", "text": "DNS"}
      ],
      "correctOptionId": "opt2"
    },
    {
      "id": "net-mcq-3",
      "text": "Which of the following is NOT a private IP address range?",
      "timeLimit": 30,
      "options": [
        {"id": "opt1", "text": "10.0.0.0/8"},
        {"id": "opt2", "text": "172.16.0.0/12"},
        {"id": "opt3", "text": "192.168.0.0/16"},
        {"id": "opt4", "text": "8.8.8.0/24"}
      ],
      "correctOptionId": "opt4"
    },
    {
      "id": "net-mcq-4",
      "text": "Which protocol operates at the Transport Layer and provides reliable, connection-oriented communication?",
      "timeLimit": 40,
      "options": [
        {"id": "opt1", "text": "UDP"},
        {"id": "opt2", "text": "IP"},
        {"id": "opt3", "text": "TCP"},
        {"id": "opt4", "text": "HTTP"}
      ],
      "correctOptionId": "opt3"
    },
    {
      "id": "net-mcq-5",
      "text": "What is the primary purpose of a firewall in a network?",
      "timeLimit": 40,
      "options": [
        {"id": "opt1", "text": "To increase network speed"},
        {"id": "opt2", "text": "To filter network traffic based on security rules"},
        {"id": "opt3", "text": "To assign IP addresses to devices"},
        {"id": "opt4", "text": "To compress data for efficient transmission"}
      ],
      "correctOptionId": "opt2"
    }
  ]'::jsonb,
  60,
  NOW()
);

-- Insert Networking Fill-in-the-Blanks Assessment
INSERT INTO assessments (title, description, "type", questions, "timeLimit", "createdAt")
VALUES (
  'Network Protocol Programming',
  'Test your knowledge of network protocols and programming with these fill-in-the-blanks questions.',
  'fill-in-blanks',
  '[
    {
      "id": "net-fib-1",
      "text": "In a TCP socket program, the server uses the _____ function to wait for incoming client connections.",
      "timeLimit": 60,
      "blanks": [
        {"id": "blank1", "correctAnswer": "listen"}
      ]
    },
    {
      "id": "net-fib-2",
      "text": "To create a UDP socket in Python, you would use socket.socket(socket.AF_INET, _____)",
      "timeLimit": 45,
      "blanks": [
        {"id": "blank1", "correctAnswer": "socket.SOCK_DGRAM"}
      ]
    },
    {
      "id": "net-fib-3",
      "text": "The HTTP response code _____ indicates a successful request.",
      "timeLimit": 30,
      "blanks": [
        {"id": "blank1", "correctAnswer": "200"}
      ]
    },
    {
      "id": "net-fib-4",
      "text": "In web development, _____ is a standard that allows servers to accept cross-origin requests from web browsers.",
      "timeLimit": 45,
      "blanks": [
        {"id": "blank1", "correctAnswer": "CORS"}
      ]
    },
    {
      "id": "net-fib-5",
      "text": "The ping command uses the _____ protocol to test connectivity between hosts.",
      "timeLimit": 30,
      "blanks": [
        {"id": "blank1", "correctAnswer": "ICMP"}
      ]
    }
  ]'::jsonb,
  90,
  NOW()
);

-- Insert Networking Video Interview Assessment
INSERT INTO assessments (title, description, "type", questions, "timeLimit", "createdAt")
VALUES (
  'Network Engineering Interview',
  'Record your responses to these network engineering interview questions.',
  'video',
  '[
    {
      "id": "net-vid-1",
      "text": "Explain the difference between TCP and UDP protocols and provide examples of when each would be the best choice.",
      "timeLimit": 120,
      "preparationTime": 60
    },
    {
      "id": "net-vid-2",
      "text": "Describe the process that happens when you type a URL into your browser and press Enter. Include as much detail as possible about networking concepts involved.",
      "timeLimit": 180,
      "preparationTime": 90
    },
    {
      "id": "net-vid-3",
      "text": "Explain how a VPN works and the security benefits it provides.",
      "timeLimit": 120,
      "preparationTime": 60
    },
    {
      "id": "net-vid-4",
      "text": "Describe how you would troubleshoot a network connectivity issue where a user cannot access a specific website.",
      "timeLimit": 150,
      "preparationTime": 60
    },
    {
      "id": "net-vid-5",
      "text": "Explain the concept of subnetting and why it's important in network design.",
      "timeLimit": 120,
      "preparationTime": 60
    }
  ]'::jsonb,
  45,
  NOW()
);

-- Assign these assessments to the candidate user (assuming candidate user id is 2)
INSERT INTO candidate_assessments ("candidateId", "assessmentId", status, "createdAt")
VALUES 
  (2, (SELECT id FROM assessments WHERE title = 'Networking Fundamentals MCQ'), 'pending', NOW()),
  (2, (SELECT id FROM assessments WHERE title = 'Network Protocol Programming'), 'pending', NOW()),
  (2, (SELECT id FROM assessments WHERE title = 'Network Engineering Interview'), 'pending', NOW());