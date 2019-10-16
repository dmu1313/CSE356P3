# CSE356 Final Project (Spring 2019) - Stack Overflow Clone
CSE 356 Final Project (Spring 2019)

<br/>

Video demonstration coming soon!

Project Specification Links:
<br/>
https://www.dropbox.com/s/gkcm3u23g43mmeg/CSE%20356%20Project%20API%20-%20Spring%202019.pdf?dl=0 (PDF)
<br/>
https://www.dropbox.com/s/bgr7akfyqz0soc6/CSE%20356%20Project%20API%20-%20Spring%202019.docx?dl=0 (Microsoft Word Doc)

<br/>
<br/>

This is my final project for the Cloud Computing course at Stony Brook University. The goal of the project was to develop a scalable, distributed clone of Stack Overflow. My system had to support up to 1,000 requests per second for an extended duration of time until about 200,000 requests were received.

<br/>
<br/>

System setup:
- Nginx load balancer running at the front (also served webapp made with React js).
- REST API developed with Express js
- Cassandra cluster used to hold media resources
- Mongo DB cluster used to hold all other data
- Elastic Search cluster used to hold questions to perform text-based search queries
- Caching performed with Memcache
- RabbitMQ used for messaging
- Ansible scripts used to quickly configure new servers

<br/>
<br/>

My system's tested performance at the end:<br\>
95% of requests were handled in < 85ms<br\>
99% of requests were handled in < 120ms<br\>

