/**
 * Playbook FAQ.
 *
 * Single source of truth — the visible Accordion consumes this array,
 * so the rendered questions and answers cannot drift from anything
 * else that references them.
 *
 * Copy answers the practical objections a visitor has at the point of
 * the form: who it is for, what it costs, what happens to the email.
 * It deliberately avoids claims about the PDF's internal contents
 * until the real document lands.
 */
export type PlaybookFaqItem = {
  question: string
  answer: string
}

export const PLAYBOOK_FAQ: ReadonlyArray<PlaybookFaqItem> = [
  {
    question: "Who is the playbook for?",
    answer:
      "Developers who already ship work with a coding agent and want the result to stay readable, testable, and maintainable after the first commit. It assumes you already use one. It is not an introduction to prompting, model comparison, or provider choice.",
  },
  {
    question: "Is the playbook free?",
    answer:
      "Yes. The PDF is free. Your email address is the only thing we ask for in exchange, and it is the only field on the form.",
  },
  {
    question: "What happens when I submit the form?",
    answer:
      "We send the download link to your inbox straight away. There is no account to create and nothing to install.",
  },
  {
    question: "What do you do with my email address?",
    answer:
      "We use it to send you the playbook. If you tick the updates box, you are also added to our mailing list and will get occasional emails about DeesseJS. That box is unchecked by default and you can unsubscribe from any email we send. See our privacy policy for retention details.",
  },
  {
    question: "Do I have to use Claude Code or any particular tool?",
    answer:
      "No. The playbook is about the codebase an agent leaves behind, not about one vendor. The habits it describes apply whichever coding agent you drive.",
  },
  {
    question: "Can I get the playbook without giving my email?",
    answer:
      "Not today. The email is how we deliver the file. We are not looking for anything else about you, and we do not pass the address to third parties.",
  },
]