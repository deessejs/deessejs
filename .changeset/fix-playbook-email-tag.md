---
"@workspace/api": patch
"@workspace/email": patch
---

Fix the playbook signup email, which the Resend API rejected because of the
tag it carried. A tag name and a tag value may only contain ASCII letters,
numbers, underscores and dashes, and the version separator was a dot. The
Resend transport now refuses such a tag before it leaves the process, and
the API logs the message the transport returned instead of stringifying the
log context into "[object Object]".
