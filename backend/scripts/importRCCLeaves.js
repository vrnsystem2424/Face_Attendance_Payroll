// backend/scripts/importRCCLeaves.js

require('dotenv').config();
const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Company = require('../models/Company');

// ════════════════════════════════════════════
// 🎯 LEAVE DATA — Directly here (no CSV needed)
// ════════════════════════════════════════════
const LEAVES_DATA = `753|01/05/2026 08:11:10|Bhimrao Wagh|BW29|Scope College|01/05/2026|01/05/2026|Full day|Personal leave|Buddh Purnima|1.0|Ravindra Singh|Rejected|0
754|01/05/2026 08:38:47|Sourabh Shrivastva|SS14|Rcc Office|01/05/2026|01/05/2026|Full day|Sick leave|Requesting for a day leave|1.0|Ravindra Singh|Approved|1
755|01/05/2026 09:23:00|Ramprasad Vishwakarma|RV57|Rcc Office|01/05/2026|01/05/2026|Before Lunch Half day|Personal leave|Personal works|0.5|Lt Col Mayank Sharma|Approved|0.5
756|01/05/2026 17:56:18|Neha Masani|NM05|Rcc Office|01/05/2026|01/05/2026|After Lunch Half day|Personal leave|Personal work|0.5|Subhash Patidar|Approved|0.5
757|01/05/2026 19:32:48|Varsha Kahar|VK62|Rcc Office|02/05/2026|02/05/2026|Full day|Emergency leave|Tabiyat theek na hone ke Karan|1.0|Lt Col Mayank Sharma|Approved|1
758|02/05/2026 06:28:48|Arun Dangi|AD02|Site|02/05/2026|02/05/2026|Full day|Emergency leave|Fever|1.0|Ravindra Singh|Rejected|0
759|02/05/2026 07:47:03|Lakhan Rajak|LR53|Hira Hardware|02/05/2026|02/05/2026|Before Lunch Half day|Personal leave|Personal work|0.5|Ravindra Singh|Approved|0.5
760|02/05/2026 08:19:25|Sourabh Shrivastva|SS14|Piyush Goenka|02/05/2026|02/05/2026|Full day|Sick leave|Feaver|1.0|Ravindra Singh|Approved|1
761|02/05/2026 08:45:01|Neha Masani|NM05|Rcc Office|02/05/2026|02/05/2026|Before Lunch Half day|Emergency leave|Today is my exam|0.5|Subhash Patidar|Approved|0.5
762|02/05/2026 10:41:06|Bharti Dhote|BD82|Rcc Office|02/05/2026|02/05/2026|Before Lunch Half day|Sick leave|Sick leave|0.5|Subhash Patidar|Approved|0.5
763|02/05/2026 12:37:55|Vivek Raikhere|VR42|Site|03/05/2026|03/05/2026|Full day|Personal leave|Family function|1.0|Ravindra Singh|Approved|1
764|03/05/2026 08:51:37|Rajesh Sonkar|RS69|Madhav Gupta|03/05/2026|03/05/2026|Full day|Emergency leave|Family work|1.0|Ravindra Singh|Approved|1
765|04/05/2026 08:10:03|Vinod Gayakwad|VG51|Scope College|04/05/2026|04/05/2026|Full day|Personal leave|Bukhar|1|Ravindra Singh|Approved|1
766|04/05/2026 10:42:44|Sunny Jharbade|SJ91|Ahuja Site|05/05/2026|05/05/2026|Full day|Personal leave|Personal work|1|Subhash Patidar|Approved|1
767|04/05/2026 11:15:52|Lakhan Rajak|LR53|Madhav Gupta|04/05/2026|06/05/2026|Before Lunch Half day|Personal leave|Urgent personal work|3|Ravindra Singh|Approved|3
768|04/05/2026 14:43:05|Ravi Rajak|RR04|Rcc Office|05/05/2026|06/05/2026|Full day|Personal leave|Out of Station|2|Lt Col Mayank Sharma|Approved|2
769|05/05/2026 09:52:49|Anurag Jatav|AJ01|Rcc Office|05/05/2026|05/05/2026|Full day|Personal leave|Personal|1|Subhash Patidar|Approved|1
770|05/05/2026 09:59:00|Pratibha Jhapate|PJ50|Rcc Office|07/05/2026|07/05/2026|Full day|Personal leave|Out of station|1|Subhash Patidar|Approved|1
771|05/05/2026 17:03:02|Sandeep Prajapati|SP40|RNTU|06/05/2026|06/05/2026|Before Lunch Half day|Personal leave|Wife ko dr ke pass|0.5|Ravindra Singh|Approved|0.5
772|05/05/2026 18:16:25|Neha Masani|NM05|Rcc Office|05/05/2026|05/05/2026|Before Lunch Half day|Personal leave|Today is my exam|0.5|Subhash Patidar|Approved|1
773|05/05/2026 20:52:34|Makhan Rajak|MR17|Dubey Site|06/05/2026|06/05/2026|Full day|Personal leave|Ghar par kam|1|Ravindra Singh|Approved|1
774|06/05/2026 05:34:14|Rajesh Sonkar|RS69|Madhav Gupta|06/05/2026|06/05/2026|Full day|Emergency leave|Cold fever|1|Ravindra Singh|Approved|1
775|06/05/2026 10:14:11|Vishal Wadiwa|VW09|Rajeev Abbot|08/05/2026|11/05/2026|Full day|Personal leave|Family wedding|4|Subhash Patidar|Approved|4
776|06/05/2026 17:22:56|Nisha Singh|NS30|Rcc Office|30/05/2026|30/05/2026|Full day|Personal leave|Going to pune|1|Subhash Patidar|Approved|1
777|07/05/2026 08:05:51|Hardik Sahu|HS20|Wallia House|07/05/2026|07/05/2026|Full day|Sick leave|Headache and body pain|1|Subhash Patidar|Approved|1
778|07/05/2026 08:16:30|Bharti Dhote|BD82|Rcc Office|07/05/2026|08/05/2026|Full day|Personal leave|Personal leave|2|Subhash Patidar|Approved|2
779|07/05/2026 09:02:00|Dolly Solanki|DS93|Rcc Office|07/05/2026|07/05/2026|Before Lunch Half day|Sick leave|Urgent work|0.5|Subhash Patidar|Approved|0.5
780|07/05/2026 09:14:02|Manoj Mahoviya|MM85|Piyush Goenka|07/05/2026|07/05/2026|Full day|Sick leave|Vomiting headache|1|Ravindra Singh|Approved|1
781|07/05/2026 15:07:09|Sunny Jharbade|SJ91|Manish Jain Site|23/05/2026|28/05/2026|Full day|Personal leave|Out of state|6|Subhash Patidar|Approved|6
782|07/05/2026 17:57:32|Devendra Sen|DS38|Rcc Office|09/05/2026|14/05/2026|Full day|Personal leave|Personal leave|6|Lt Col Mayank Sharma|Approved|6
783|08/05/2026 09:03:16|Hardik Sahu|HS20|Wallia House|08/05/2026|08/05/2026|Full day|Sick leave|Not feeling well|1|Subhash Patidar|Approved|1
784|08/05/2026 09:27:51|Neha Masani|NM05|Rcc Office|08/05/2026|08/05/2026|Before Lunch Half day|Emergency leave|Going to exam|0.5|Subhash Patidar|Approved|0.5
785|08/05/2026 10:03:58|Nisha Singh|NS30|Rcc Office|08/05/2026|08/05/2026|After Lunch Half day|Emergency leave|Personal|0.5|Subhash Patidar|Approved|0.5
786|08/05/2026 10:20:07|Makhan Rajak|MR17|Dubey Site|09/05/2026|12/05/2026|Full day|Personal leave|Gaon jana hai|4|Ravindra Singh|Approved|4
787|08/05/2026 13:20:19|Gopal Chourasia|GC38|Manish Jain Site|09/05/2026|09/05/2026|Full day|Personal leave|College|1|Ravindra Singh|Approved|1
788|10/05/2026 08:37:14|Vinod Gayakwad|VG51|Scope College|10/05/2026|10/05/2026|Full day|Emergency leave|Pados me death|1|Ravindra Singh|Approved|1
789|10/05/2026 09:55:09|Vaibhav Yadav|VY55|Madhav Gupta|10/05/2026|10/05/2026|Full day|Sick leave|High fever and loo|1|Ravindra Singh|Approved|1
790|10/05/2026 13:51:20|Janmjay Sinotiya|JS90|Rajeev Abbot|12/05/2026|13/05/2026|Full day|Personal leave|Going home Betul|2|Ravindra Singh|Approved|2
791|10/05/2026 22:02:49|Indrakala Sharma|IS44|Rcc Office|12/05/2026|12/05/2026|Full day|Personal leave|Personal leave|1|Ravindra Singh|Approved|1
792|11/05/2026 09:27:57|Dolly Solanki|DS93|Rcc Office|11/05/2026|11/05/2026|Full day|Sick leave|Not well|1|Subhash Patidar|Approved|1
793|11/05/2026 10:37:27|Karuna Sonone|KS67|Rcc Office|11/05/2026|11/05/2026|Before Lunch Half day|Personal leave|Hospital|0.5|Subhash Patidar|Approved|0.5
794|11/05/2026 12:10:29|Vaibhav Yadav|VY55|Madhav Gupta|11/05/2026|11/05/2026|After Lunch Half day|Sick leave|Loo and fever|0.5|Ravindra Singh|Approved|0.5
795|12/05/2026 08:09:59|Ramprasad Vishwakarma|RV57|Rcc Office|12/05/2026|12/05/2026|Before Lunch Half day|Personal leave|Personal works|0.5|Lt Col Mayank Sharma|Approved|0.5
796|12/05/2026 09:03:02|Neha Masani|NM05|Rcc Office|12/05/2026|12/05/2026|Before Lunch Half day|Personal leave|Exam|0.5|Subhash Patidar|Approved|0.5
797|12/05/2026 10:14:35|Vishal Wadiwa|VW09|Rajeev Abbot|12/05/2026|12/05/2026|Full day|Personal leave|Fever|1|Subhash Patidar|Approved|1
798|12/05/2026 14:47:55|Vivek Raikhere|VR42|Ahuja Site|13/05/2026|13/05/2026|Full day|Personal leave|Pooja|1|Ravindra Singh|Approved|1
799|13/05/2026 09:33:08|Shashank Choudhary|SC71|Rcc Office|10/06/2026|28/06/2026|Full day|Personal leave|Wedding|19|Subhash Patidar|Approved|19
800|13/05/2026 10:11:59|Ritika Vishwakarma|RV19|Rcc Office|16/05/2026|16/05/2026|Full day|Personal leave|One day leave|1|Lt Col Mayank Sharma|Approved|1
801|13/05/2026 17:10:45|Hardik Sahu|HS20|Site|13/05/2026|13/05/2026|Before Lunch Half day|Personal leave|Personal Work|0.5|Subhash Patidar|Approved|0.5
802|13/05/2026 21:32:03|Ravi Rajak|RR04|Rcc Office|14/05/2026|15/05/2026|Full day|Emergency leave|Out of Station|2|Lt Col Mayank Sharma|Approved|2
803|14/05/2026 07:42:09|Sourabh Shrivastva|SS14|Piyush Goenka|14/05/2026|16/05/2026|Full day|Emergency leave|Emergency|3|Ravindra Singh|Approved|3
804|14/05/2026 08:44:52|Bhimrao Wagh|BW29|Scope College|14/05/2026|14/05/2026|Full day|Personal leave|Ghar ka kam|1|Ravindra Singh|Approved|1
805|14/05/2026 08:48:27|Neha Masani|NM05|Rcc Office|14/05/2026|14/05/2026|Before Lunch Half day|Personal leave|Exam|0.5|Subhash Patidar|Approved|0.5
806|14/05/2026 10:45:04|Suman Kirar|SK58|Rcc Office|14/05/2026|14/05/2026|Full day|Emergency leave|Emergency leave|1|Subhash Patidar|Approved|1
807|14/05/2026 20:31:12|Gopal Chourasia|GC38|Manish Jain Site|19/05/2026|19/05/2026|Full day|Personal leave|College|1|Ravindra Singh|Approved|1
808|15/05/2026 08:14:04|Bhimrao Wagh|BW29|Scope College|15/05/2026|15/05/2026|Before Lunch Half day|Personal leave|Ghar ka kam|0.5|Ravindra Singh|Approved|0.5
809|15/05/2026 12:56:21|Karuna Sonone|KS67|Rcc Office|15/05/2026|15/05/2026|After Lunch Half day|Sick leave|Tabiyat thik nhi|0.5|Subhash Patidar|Approved|0.5
810|15/05/2026 23:19:32|Pravesh Singh Baghel|PSB80|Rcc Office|16/05/2026|16/05/2026|Full day|Personal leave|Exam work|1|Subhash Patidar|Approved|1
811|16/05/2026 13:48:59|Neha Masani|NM05|Rcc Office|16/05/2026|16/05/2026|Full day|Personal leave|Personal leave|1|Subhash Patidar|Approved|1
812|17/05/2026 07:25:53|Arun Dangi|AD02|Site|17/05/2026|17/05/2026|Full day|Sick leave|Fever|1|Ravindra Singh|Approved|1
813|17/05/2026 15:29:02|Vishal Wadiwa|VW09|Rajesh Gupta|19/05/2026|19/05/2026|Full day|Personal leave|Exam|1|Subhash Patidar|Approved|1
814|18/05/2026 06:01:26|Lakhan Rajak|LR53|Gupta|18/05/2026|19/05/2026|Full day|Sick leave|Heatstroke fever|2|Ravindra Singh|Approved|2
815|18/05/2026 07:05:19|Rajesh Sonkar|RS69|Madhav Gupta|18/05/2026|18/05/2026|Full day|Emergency leave|Fever|1|Ravindra Singh|Approved|1
816|18/05/2026 08:39:23|Anjali Malviya|AM15|Rcc Office|18/05/2026|18/05/2026|Full day|Personal leave|Health issue|1|Subhash Patidar|Approved|1
817|18/05/2026 09:08:37|Manoj Mahoviya|MM85|Piyush Goenka|18/05/2026|18/05/2026|Full day|Emergency leave|Uncle passed away|1|Ravindra Singh|Approved|1
818|18/05/2026 09:13:18|Bharti Dhote|BD82|Rcc Office|18/05/2026|18/05/2026|Before Lunch Half day|Sick leave|Going to DC|0.5|Subhash Patidar|Approved|0.5
819|19/05/2026 07:51:38|Rajesh Sonkar|RS69|Madhav Gupta|19/05/2026|19/05/2026|Full day|Emergency leave|Fever|1|Ravindra Singh|Approved|1
820|19/05/2026 08:11:14|Deepak Sinotiya|DS49|Scope College|19/05/2026|19/05/2026|Full day|Sick leave|Health issue|1|Subhash Patidar|Approved|1
821|19/05/2026 09:30:57|Mohit Kumar Mishra|MKM38|Rcc Office|26/05/2026|27/05/2026|Full day|Personal leave|Out of station|2|Ravindra Singh|Approved|2
822|19/05/2026 22:20:27|Pravesh Singh Baghel|PSB80|Rcc Office|20/05/2026|20/05/2026|Full day|Personal leave|College exam|1|Subhash Patidar|Approved|1
823|20/05/2026 06:52:47|Arun Dangi|AD02|Site|20/05/2026|20/05/2026|Full day|Personal leave|Relative death|1|Ravindra Singh|Approved|1
824|20/05/2026 09:18:46|Vaibhav Yadav|VY55|Madhav Gupta|20/05/2026|20/05/2026|Full day|Sick leave|Heat stroke fever|1|Ravindra Singh|Approved|1
825|20/05/2026 09:27:20|Deepak Sinotiya|DS49|Scope College|20/05/2026|20/05/2026|Full day|Sick leave|Health issue|1|Subhash Patidar|Approved|1
826|20/05/2026 10:36:32|Sunil maran|SM29|Scope College|20/05/2026|20/05/2026|Full day|Emergency leave|Night shift|1|Ravindra Singh|Approved|1
827|20/05/2026 15:57:19|Neha Masani|NM05|Rcc Office|20/05/2026|20/05/2026|Full day|Personal leave|Personal leave|1|Subhash Patidar|Approved|1
828|20/05/2026 19:24:49|Ramprasad Vishwakarma|RV57|Rcc Office|21/05/2026|21/05/2026|Full day|Personal leave|Personal works|1|Lt Col Mayank Sharma|Approved|1
829|21/05/2026 08:28:06|Makhan Rajak|MR17|Dubey Site|21/05/2026|21/05/2026|Full day|Emergency leave|Bukhar|1|Ravindra Singh|Approved|1
830|21/05/2026 12:42:07|Sandeep Patil|SP06|Rcc Office|21/05/2026|21/05/2026|After Lunch Half day|Personal leave|Personal works|0.5|Lt Col Mayank Sharma|Approved|0.5
831|22/05/2026 08:18:01|Sunil maran|SM29|Scope College|22/05/2026|22/05/2026|Before Lunch Half day|Emergency leave|Emergency kam|0.5|Ravindra Singh|Approved|0.5
832|22/05/2026 09:22:16|Nisha Singh|NS30|Rcc Office|22/05/2026|22/05/2026|Before Lunch Half day|Personal leave|Personal leave|0.5|Subhash Patidar|Approved|0.5
833|22/05/2026 09:26:22|Vishal Wadiwa|VW09|Rajeev Abbot|22/05/2026|23/05/2026|Full day|Emergency leave|Accident|2|Subhash Patidar|Approved|2
834|23/05/2026 08:20:46|Azra Ansari|AA76|Rcc Office|23/05/2026|23/05/2026|Full day|Personal leave|Not feeling well|1|Ravindra Singh|Approved|1
835|23/05/2026 09:14:58|Shashank Choudhary|SC71|Rcc Office|23/05/2026|23/05/2026|Full day|Emergency leave|Not well|1|Subhash Patidar|Approved|1
836|23/05/2026 09:29:02|Arti Nandmehar|AN72|Rcc Office|23/05/2026|23/05/2026|Full day|Personal leave|Personal|1|Subhash Patidar|Approved|1
837|23/05/2026 13:54:22|Janmjay Sinotiya|JS90|Rajeev Abbot|24/05/2026|24/05/2026|Full day|Emergency leave|Urgent work|1|Ravindra Singh|Approved|1
838|24/05/2026 08:29:33|Vinod Gayakwad|VG51|Scope College|24/05/2026|24/05/2026|Full day|Emergency leave|Motion|1|Ravindra Singh|Approved|1
839|25/05/2026 08:40:03|Deepak Sinotiya|DS49|Scope College|25/05/2026|25/05/2026|Full day|Emergency leave|Family matter|1|Subhash Patidar|Approved|1
840|25/05/2026 09:04:52|Ritika Vishwakarma|RV19|Rcc Office|25/05/2026|25/05/2026|Full day|Sick leave|Not feeling well|1|Lt Col Mayank Sharma|Approved|1
841|25/05/2026 09:32:33|Manoj Mahoviya|MM85|Piyush Goenka|25/05/2026|25/05/2026|Full day|Sick leave|Body pain|1|Ravindra Singh|Approved|1
842|25/05/2026 09:50:40|Anurag Jatav|AJ01|Rcc Office|25/05/2026|25/05/2026|Full day|Emergency leave|Emergency|1|Subhash Patidar|Approved|1
843|25/05/2026 14:40:48|Gopal Chourasia|GC38|Manish Jain Site|29/05/2026|29/05/2026|Full day|Personal leave|College|1|Ravindra Singh|Approved|1
844|25/05/2026 16:32:30|Arun Dangi|AD02|Site|06/06/2026|06/06/2026|Full day|Personal leave|Home work|1|Ravindra Singh|Approved|1
845|26/05/2026 07:45:19|Indrakala Sharma|IS44|Rcc Office|26/05/2026|26/05/2026|Full day|Personal leave|Personal leave|1|Ravindra Singh|Approved|1
846|26/05/2026 09:19:53|Manoj Mahoviya|MM85|Piyush Goenka|26/05/2026|26/05/2026|Full day|Sick leave|Swelling in hand|1|Ravindra Singh|Approved|1
847|26/05/2026 21:48:06|Sandeep Patil|SP06|Rcc Office|27/05/2026|28/05/2026|Full day|Personal leave|Personal Work|2|Lt Col Mayank Sharma|Approved|2
848|27/05/2026 08:19:51|Hardik Sahu|HS20|Wallia House|27/05/2026|27/05/2026|Full day|Sick leave|Headache vomiting|1|Subhash Patidar|Approved|1
849|27/05/2026 10:16:38|Vaibhav Yadav|VY55|Madhav Gupta|27/05/2026|27/05/2026|Full day|Sick leave|Heat stroke|1|Ravindra Singh|Approved|1
850|27/05/2026 16:11:30|Azra Ansari|AA76|Rcc Office|28/05/2026|30/05/2026|Full day|Personal leave|Eid al-Adha|3|Ravindra Singh|Approved|3
851|27/05/2026 17:39:11|Azra Ansari|AA76|Rcc Office|27/05/2026|27/05/2026|After Lunch Half day|Personal leave|Eid al-Adha|0.5|Ravindra Singh|Approved|0.5
852|27/05/2026 19:53:04|Deepak Sinotiya|DS49|Scope College|28/05/2026|28/05/2026|Full day|Personal leave|Family outing|1|Subhash Patidar|Approved|1
853|27/05/2026 23:58:28|Arti Nandmehar|AN72|Site|28/05/2026|28/05/2026|Full day|Personal leave|Urgent work|1|Subhash Patidar|Approved|1
854|28/05/2026 10:08:37|Bharti Dhote|BD82|Rcc Office|28/05/2026|28/05/2026|After Lunch Half day|Personal leave|Personal leave|0.5|Subhash Patidar|Approved|0.5
855|29/05/2026 08:56:32|Vishal Wadiwa|VW09|Rajeev Abbot|29/05/2026|29/05/2026|Full day|Emergency leave|Fever|1|Subhash Patidar|Approved|1
856|29/05/2026 09:45:20|Karuna Sonone|KS67|Rcc Office|29/05/2026|29/05/2026|After Lunch Half day|Emergency leave|Emergency|0.5|Subhash Patidar|Approved|0.5
857|29/05/2026 13:43:11|Vinod Gayakwad|VG51|Gupta|31/05/2026|01/06/2026|Full day|Personal leave|Nasik wife dr|2|Ravindra Singh|Approved|2
858|29/05/2026 13:47:34|Lakhan Rajak|LR53|Madhav Gupta|30/05/2026|30/05/2026|Full day|Personal leave|Family function|1|Ravindra Singh|Approved|1
859|29/05/2026 20:32:30|Varsha Kahar|VK62|Rcc Office|30/05/2026|30/05/2026|Full day|Personal leave|Not feeling well|1|Lt Col Mayank Sharma|Approved|1
860|29/05/2026 20:42:25|Shashank Choudhary|SC71|Rcc Office|30/05/2026|30/05/2026|Full day|Personal leave|Urgent work|1|Subhash Patidar|Approved|1
861|30/05/2026 08:42:30|Sunil maran|SM29|Scope College|30/05/2026|30/05/2026|Full day|Emergency leave|Night shift|1|Ravindra Singh|Approved|1
862|30/05/2026 09:08:53|Deepak Sinotiya|DS49|Scope College|30/05/2026|30/05/2026|After Lunch Half day|Emergency leave|Half-day leave|0.5|Subhash Patidar|Approved|0.5
863|30/05/2026 10:11:03|Anjali Malviya|AM15|Rcc Office|30/05/2026|30/05/2026|Full day|Personal leave|Mother hospital|1|Subhash Patidar|Approved|1
864|30/05/2026 11:00:22|Bharti Dhote|BD82|Rcc Office|30/05/2026|30/05/2026|Full day|Personal leave|Personal Leave|1|Subhash Patidar|Approved|1`;

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
const normalizeDate = (dateStr) => {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const y = parseInt(parts[2]);
  return `${d}/${m}/${y}`;
};

const mapLeaveType = (typeStr) => {
  const lower = typeStr.toLowerCase();
  if (lower.includes('sick')) return 'sick';
  if (lower.includes('emergency')) return 'emergency';
  if (lower.includes('personal') || lower.includes('casual')) return 'casual';
  return 'other';
};

const detectHalfDay = (shiftStr) => {
  const lower = shiftStr.toLowerCase();
  if (lower.includes('before lunch')) return { isHalfDay: true, period: 'first' };
  if (lower.includes('after lunch')) return { isHalfDay: true, period: 'second' };
  return { isHalfDay: false, period: '' };
};

const mapStatus = (statusStr) => {
  const lower = statusStr.toLowerCase();
  if (lower.includes('approved')) return 'approved';
  if (lower.includes('rejected')) return 'rejected';
  return 'pending';
};

// ════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════
const importLeaves = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Parse leave data
    const lines = LEAVES_DATA.trim().split('\n');
    console.log(`📊 Total leaves to import: ${lines.length}\n`);

    // Get RCC company
    const rcc = await Company.findOne({ code: 'RCC' });
    if (!rcc) {
      console.error('❌ RCC company not found');
      process.exit(1);
    }

    // Cache employees
    const employees = await Employee.find({ company_id: rcc._id });
    const empMap = {};
    employees.forEach(e => { empMap[e.emp_code] = e; });

    console.log(`👥 RCC Employees in DB: ${employees.length}\n`);
    console.log('═══════════════════════════════════════');
    console.log('  IMPORTING RCC LEAVES (May 2026)');
    console.log('═══════════════════════════════════════\n');

    let created = 0;
    let skipped = 0;
    let notFound = 0;
    const notFoundList = new Set();

    for (let i = 0; i < lines.length; i++) {
      const fields = lines[i].split('|');
      if (fields.length < 13) continue;

      const [uid, timestamp, name, empCode, dept, dateFrom, dateTo, shift, leaveType, reason, days, manager, status] = fields;

      const employee = empMap[empCode.trim()];
      if (!employee) {
        notFound++;
        notFoundList.add(`${empCode} - ${name}`);
        continue;
      }

      const fromDate = normalizeDate(dateFrom);
      const toDate = normalizeDate(dateTo) || fromDate;
      const leaveDays = parseFloat(days) || 1;
      const { isHalfDay, period } = detectHalfDay(shift);
      const statusMapped = mapStatus(status);

      try {
        const existing = await Leave.findOne({
          emp_id: employee._id,
          from_date: fromDate,
          to_date: toDate,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await Leave.create({
          emp_id: employee._id,
          emp_code: employee.emp_code,
          name: employee.name,
          company_id: employee.company_id,
          department: employee.department,
          from_date: fromDate,
          to_date: toDate,
          shift: 'General',
          leave_type: mapLeaveType(leaveType),
          is_half_day: isHalfDay,
          half_day_period: period,
          leave_days: leaveDays,
          applied_days: leaveDays,
          approved_days: statusMapped === 'approved' ? leaveDays : 0,
          paid_days: statusMapped === 'approved' ? leaveDays : 0,
          unpaid_days: 0,
          balance_before: 0,
          balance_after: 0,
          reason: reason.trim(),
          status: statusMapped,
          manager_name: manager.trim(),
          manager_remark: statusMapped === 'approved' ? 'Approved (imported)' : 'Rejected (imported)',
          admin_remark: 'Imported from old system',
          manager_action_date: new Date(),
        });

        console.log(`✅ ${name.padEnd(25)} | ${fromDate} → ${toDate} | ${leaveDays}d | ${statusMapped}`);
        created++;
      } catch (err) {
        console.log(`❌ ${name}: ${err.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Created:    ${created}`);
    console.log(`⏭️  Skipped:    ${skipped}`);
    console.log(`❌ Not found:  ${notFound}`);
    console.log('═══════════════════════════════════════\n');

    if (notFoundList.size > 0) {
      console.log('⚠️  Employees not found:');
      Array.from(notFoundList).forEach(e => console.log(`   - ${e}`));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

importLeaves();