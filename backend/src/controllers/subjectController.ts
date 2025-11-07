import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';

// @desc    Fetch all subjects with question counts
// @route   GET /api/subjects
// @access  Public
export const getSubjects = async (req: Request, res: Response) => {
    try {
        const subjects = await Subject.find({});
        
        // Get question counts for each subject
        const subjectsWithCounts = await Promise.all(
            subjects.map(async (subject) => {
                const count = await Question.countDocuments({ subjectId: subject._id });
                return {
                    ...subject.toJSON(),
                    questionCount: count
                };
            })
        );
        
        
        // DEBUG: Log the data just before sending the response
        console.log('--- [DEBUG] Data being sent from getSubjects API ---');
        console.log(JSON.stringify(subjectsWithCounts, null, 2));
        console.log('---------------------------------------------');

        res.json(subjectsWithCounts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi tải môn học" });
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Admin
export const updateSubject = async (req: Request, res: Response) => {
    try {
        const { name, icon, description } = req.body;
        const subjectId = req.params.id;

        const subject = await Subject.findById(subjectId);

        if (!subject) {
            return res.status(404).json({ message: "Không tìm thấy môn học" });
        }

        if (name) subject.name = name;
        if (icon) subject.icon = icon;
        if (description) (subject as any).description = description;

        await subject.save();
        res.json(subject);
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ message: "Lỗi khi cập nhật môn học" });
    }
};